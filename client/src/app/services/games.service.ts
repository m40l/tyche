import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { merge, Observable, repeat, ReplaySubject, shareReplay, skipUntil, Subject, throttleTime, timer } from 'rxjs';
import { Game, OwnedGame } from '../../../../types/models';

@Injectable({
    providedIn: 'root',
})
export default class GamesService {
    private gamesObservable$: Observable<OwnedGame[]>;
    private refreshGamesRequests = new Subject<undefined>();
    private lazyRefreshGamesRequests = new Subject<undefined>();

    constructor(private httpClient: HttpClient) {
        const allRefreshGamesRequests = merge(
            this.refreshGamesRequests,
            this.lazyRefreshGamesRequests.pipe(skipUntil(timer(5000)))
        );
        this.gamesObservable$ = this.httpClient.get<OwnedGame[]>(`/api/games`).pipe(
            repeat({
                delay: () => allRefreshGamesRequests,
            }),
            shareReplay(1)
        );
    }

    refreshGames() {
        this.refreshGamesRequests.next(undefined);
    }

    lazyRefreshGames() {
        this.lazyRefreshGamesRequests.next(undefined);
    }

    gamesObservable(): Observable<OwnedGame[]> {
        this.lazyRefreshGames();
        return this.gamesObservable$;
    }
}
