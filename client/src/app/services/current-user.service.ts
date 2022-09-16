import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { merge, Observable, repeat, shareReplay, skipUntil, Subject, timer } from 'rxjs';
import { User } from '../../../../types/models';

@Injectable({
    providedIn: 'root',
})
export default class CurrentUserService {
    private currentUserObservable$: Observable<User>;
    private refreshCurrentUserRequests = new Subject<undefined>();
    private lazyRefreshCurrentUserRequests = new Subject<undefined>();

    constructor(private httpClient: HttpClient) {
        const allRefreshCurrentUserRequests = merge(
            this.refreshCurrentUserRequests,
            this.lazyRefreshCurrentUserRequests.pipe(skipUntil(timer(5000)))
        );
        this.currentUserObservable$ = this.httpClient.get<User>(`/api/users/current`).pipe(
            repeat({
                delay: () => allRefreshCurrentUserRequests,
            }),
            shareReplay(1)
        );
    }

    refreshCurrentUser() {
        this.refreshCurrentUserRequests.next(undefined);
    }

    lazyRefreshCurrentUser() {
        this.lazyRefreshCurrentUserRequests.next(undefined);
    }

    currentUserObservable(): Observable<User> {
        this.lazyRefreshCurrentUser();
        return this.currentUserObservable$;
    }
}
