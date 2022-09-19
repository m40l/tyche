import { Component, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
    concatMap,
    exhaustMap,
    map,
    mergeMap,
    Observable,
    repeat,
    shareReplay,
    Subject,
    Subscription,
    tap,
} from 'rxjs';
import { ChooseGameEvent } from '../../../../../types/events';
import { CustomGame, Game, Session, User } from '../../../../../types/models';
import {
    AddCustomGameRequest,
    AddSessionUserRequest,
    BanGameRequest,
    DeleteGameRequest,
    UnbanGameRequest,
} from '../../../../../types/requests';
import FriendsService from '../../services/friends.service';
import SessionService from '../../services/session.service';

@Component({
    selector: 'app-session',
    templateUrl: 'session.component.html',
    styles: [],
})
export class SessionComponent implements OnDestroy {
    session$: Observable<Session>;
    allowedCommonGames$: Observable<Game[]>;
    customGameName = new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
    });

    private refreshSessionRequests = new Subject<undefined>();
    private subscriptions: Subscription[];
    private syncGamesRequests = new Subject<undefined>();
    private chooseGameRequests = new Subject<undefined>();
    private deleteGameRequests = new Subject<CustomGame>();
    private banGameRequests = new Subject<Game>();
    private unbanGameRequests = new Subject<Game>();
    private addCustomGameRequests = new Subject<CustomGame>();
    private addSessionUserRequests = new Subject<string>();
    public choseGameEvent = new Subject<ChooseGameEvent>();

    public addableFriends$: Observable<User[]>;
    public newSessionUser = new FormControl('', { nonNullable: true });

    constructor(
        private route: ActivatedRoute,
        private sessionService: SessionService,
        private friendsService: FriendsService
    ) {
        let sessionIdObservable = this.route.params.pipe(map((params): string => params['id']));
        this.session$ = sessionIdObservable.pipe(
            concatMap((id) =>
                this.sessionService.getSession(id).pipe(
                    repeat({
                        delay: () => this.refreshSessionRequests,
                    })
                )
            ),
            shareReplay(1)
        );
        this.allowedCommonGames$ = this.session$.pipe(
            map((session) => this.calculateAllowedGommonGames(session.commonGames, session.bannedGames))
        );

        this.addableFriends$ = this.session$.pipe(
            mergeMap((session) =>
                this.friendsService
                    .friendsObservable()
                    .pipe(
                        map((friends) =>
                            friends.filter(
                                (friend) =>
                                    session.users.find((existingUser) => friend._id === existingUser._id) === undefined
                            )
                        )
                    )
            )
        );

        this.subscriptions = [
            this.syncGamesRequests.pipe(mergeMap(() => sessionIdObservable)).subscribe((id) => this._syncGames(id)),
            this.chooseGameRequests.pipe(mergeMap(() => sessionIdObservable)).subscribe((id) => this._chooseGame(id)),
            sessionIdObservable
                .pipe(
                    mergeMap((id) => this.sessionService.getSessionEvents(id)),
                    tap((event) => {
                        console.log(event);
                        $('#chooseGameNotification').modal('show');
                    })
                )
                .subscribe({
                    next: (event) => this.choseGameEvent.next(event),
                    complete: () => console.log(78),
                }),
            this.deleteGameRequests
                .pipe(
                    mergeMap((customGame) =>
                        sessionIdObservable.pipe(
                            map((sessionId) => ({
                                sessionId,
                                customGame,
                            }))
                        )
                    )
                )
                .subscribe((deleteGameRequest) => this._deleteGame(deleteGameRequest)),
            this.banGameRequests
                .pipe(
                    mergeMap((game) =>
                        sessionIdObservable.pipe(
                            map((sessionId) => ({
                                sessionId,
                                game,
                            }))
                        )
                    )
                )
                .subscribe((banGameRequest) => this._banGame(banGameRequest)),
            this.unbanGameRequests
                .pipe(
                    mergeMap((game) =>
                        sessionIdObservable.pipe(
                            map((sessionId) => ({
                                sessionId,
                                game,
                            }))
                        )
                    )
                )
                .subscribe((unbanGameRequest) => this._unbanGame(unbanGameRequest)),
            this.addCustomGameRequests
                .pipe(
                    mergeMap((customGame) =>
                        sessionIdObservable.pipe(
                            map((sessionId) => ({
                                sessionId,
                                customGame,
                            }))
                        )
                    )
                )
                .subscribe((addCustomGameRequest) => this._addCustomGame(addCustomGameRequest)),
            this.addSessionUserRequests
                .pipe(
                    mergeMap((userId) =>
                        sessionIdObservable.pipe(
                            map((sessionId) => ({
                                sessionId,
                                userId,
                            }))
                        )
                    )
                )
                .subscribe((addSessionUserRequest) => this._addSessionUser(addSessionUserRequest)),
        ];
    }

    private calculateAllowedGommonGames(commonGames: Game[], bannedGames: Game[]): Game[] {
        return commonGames.filter((commonGame) => {
            for (const bannedGame of bannedGames) {
                if (commonGame._id == bannedGame._id) {
                    return false;
                }
            }
            return true;
        });
    }
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    refreshSession() {
        this.refreshSessionRequests.next(undefined);
    }

    syncGames() {
        this.syncGamesRequests.next(undefined);
    }

    private _syncGames(id: string) {
        this.sessionService.syncSessionGames(id).subscribe(() => this.refreshSession());
    }

    chooseGame() {
        this.chooseGameRequests.next(undefined);
    }

    private _chooseGame(id: string) {
        console.log(149);
        this.sessionService.chooseGame(id).subscribe(() => this.refreshSession());
    }

    deleteGame(customGame: CustomGame) {
        this.deleteGameRequests.next(customGame);
    }

    private _deleteGame(deleteGameRequest: DeleteGameRequest) {
        this.sessionService.deleteGame(deleteGameRequest).subscribe(() => this.refreshSession());
    }

    banGame(game: Game) {
        this.banGameRequests.next(game);
    }

    private _banGame(banGameRequest: BanGameRequest) {
        this.sessionService.banGame(banGameRequest).subscribe(() => this.refreshSession());
    }

    unbanGame(game: Game) {
        this.unbanGameRequests.next(game);
    }

    private _unbanGame(unbanGameRequest: UnbanGameRequest) {
        this.sessionService.unbanGame(unbanGameRequest).subscribe(() => this.refreshSession());
    }

    addCustomGame() {
        this.addCustomGameRequests.next({
            name: this.customGameName.value,
        });
    }

    private _addCustomGame(addCustomGameRequest: AddCustomGameRequest) {
        this.sessionService.addCustomGame(addCustomGameRequest).subscribe(() => this.refreshSession());
    }

    addSessionUser() {
        this.addSessionUserRequests.next(this.newSessionUser.value);
        this.newSessionUser.reset();
    }

    private _addSessionUser(addSessionUserRequest: AddSessionUserRequest) {
        this.sessionService.addSessionUser(addSessionUserRequest).subscribe(() => this.refreshSession());
    }
}
