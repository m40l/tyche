import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { merge, Observable, repeat, shareReplay, skipUntil, Subject, timer } from 'rxjs';
import { Session } from '../../../../types/models';

@Injectable({
    providedIn: 'root',
})
export default class SessionsService {
    private sessionsObservable$: Observable<Session[]>;
    private refreshSessionsRequests = new Subject<undefined>();
    private lazyRefreshSessionsRequests = new Subject<undefined>();

    constructor(private httpClient: HttpClient) {
        const allRefreshSessionsRequests = merge(
            this.refreshSessionsRequests,
            this.lazyRefreshSessionsRequests.pipe(skipUntil(timer(5000)))
        );
        this.sessionsObservable$ = this.httpClient.get<Session[]>(`/api/sessions`).pipe(
            repeat({
                delay: () => allRefreshSessionsRequests,
            }),
            shareReplay(1)
        );
    }

    refreshSessions() {
        this.refreshSessionsRequests.next(undefined);
    }

    lazyRefreshSessions() {
        this.lazyRefreshSessionsRequests.next(undefined);
    }

    sessionsObservable(): Observable<Session[]> {
        this.lazyRefreshSessions();
        return this.sessionsObservable$;
    }
}
