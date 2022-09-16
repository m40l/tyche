import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { merge, Observable, repeat, shareReplay, skipUntil, Subject, timer } from 'rxjs';
import { Group } from '../../../../types/models';

@Injectable({
    providedIn: 'root',
})
export default class GroupsService {
    private groupsObservable$: Observable<Group[]>;
    private refreshGroupsRequests = new Subject<undefined>();
    private lazyRefreshGroupsRequests = new Subject<undefined>();

    constructor(private httpClient: HttpClient) {
        const allRefreshGroupsRequests = merge(
            this.refreshGroupsRequests,
            this.lazyRefreshGroupsRequests.pipe(skipUntil(timer(5000)))
        );
        this.groupsObservable$ = this.httpClient.get<Group[]>(`/api/groups`).pipe(
            repeat({
                delay: () => allRefreshGroupsRequests,
            }),
            shareReplay(1)
        );
    }

    refreshGroups() {
        this.refreshGroupsRequests.next(undefined);
    }

    lazyRefreshGroups() {
        this.lazyRefreshGroupsRequests.next(undefined);
    }

    groupsObservable(): Observable<Group[]> {
        this.lazyRefreshGroups();
        return this.groupsObservable$;
    }
}
