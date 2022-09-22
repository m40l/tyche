import { Component } from '@angular/core';
import {
    catchError,
    concat,
    debounceTime,
    distinctUntilChanged,
    map,
    Observable,
    of,
    Subject,
    switchMap,
    tap,
} from 'rxjs';
import GameService from 'src/services/game.service';
import { Game, OwnedGame, Platform, User } from '../../../../../types/models';
import CurrentUserService from '../../services/current-user.service';
import GamesService from '../../services/games.service';

type OwnedGamesByCategories = {
    [Platform.None]: Game[];
    [Platform.Steam]: Game[];
};

@Component({
    selector: 'app-games',
    templateUrl: 'games.component.html',
    styles: [],
})
export class GamesComponent {
    user$: Observable<User>;
    games$: Observable<OwnedGame[]>;
    sortedGames$: Observable<OwnedGamesByCategories>;

    newGameSelected?: string;
    newGameInput$ = new Subject<string>();
    newGamesFiltered$: Observable<Game[]>;
    gamesLoading = false;

    constructor(
        private gameService: GameService,
        private gamesService: GamesService,
        private currentUserService: CurrentUserService
    ) {
        this.user$ = this.currentUserService.currentUserObservable();
        this.games$ = this.gamesService.gamesObservable();
        this.sortedGames$ = this.games$.pipe(
            map((games) =>
                games.reduce(
                    (ownedGamesByCategories, game) => {
                        ownedGamesByCategories[game.platform].push(game.game);
                        return ownedGamesByCategories;
                    },
                    <OwnedGamesByCategories>{
                        [Platform.None]: [],
                        [Platform.Steam]: [],
                    }
                )
            )
        );

        this.newGamesFiltered$ = concat(
            of([]), // default items
            this.newGameInput$.pipe(
                distinctUntilChanged(),
                tap(() => (this.gamesLoading = true)),
                debounceTime(1000),
                switchMap((term) =>
                    this.gameService.searchGames(term).pipe(
                        catchError(() => of([])), // empty list on error
                        tap(() => (this.gamesLoading = false))
                    )
                )
            )
        );
    }

    onChange() {
        if (this.newGameSelected) {
            this.gameService
                .addGame({
                    gameId: this.newGameSelected,
                })
                .subscribe(() => {
                    this.gamesService.refreshGames();
                    this.newGameSelected = undefined;
                });
        }
    }

    syncFromSteam() {
        this.gameService.syncFromSteam().subscribe(() => this.gamesService.refreshGames());
    }
}
