import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { merge, Observable, repeat, shareReplay, skipUntil, Subject, timer } from 'rxjs';
import { User } from '../../../../types/models';

@Injectable({
    providedIn: 'root',
})
export default class FriendsService {
    private friendsObservable$: Observable<User[]>;
    private refreshFriendsRequests = new Subject<undefined>();
    private lazyRefreshFriendsRequests = new Subject<undefined>();

    constructor(private httpClient: HttpClient) {
        const allRefreshFriendsRequests = merge(
            this.refreshFriendsRequests,
            this.lazyRefreshFriendsRequests.pipe(skipUntil(timer(5000)))
        );
        this.friendsObservable$ = this.httpClient.get<User[]>(`/api/friends/`).pipe(
            repeat({
                delay: () => allRefreshFriendsRequests,
            }),
            shareReplay(1)
        );
    }

    refreshFriends() {
        this.refreshFriendsRequests.next(undefined);
    }

    lazyRefreshFriends() {
        this.lazyRefreshFriendsRequests.next(undefined);
    }

    friendsObservable(): Observable<User[]> {
        this.lazyRefreshFriends();
        return this.friendsObservable$;
    }
}
