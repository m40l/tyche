import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import FriendsService from 'src/services/friends.service';
import SessionsService from 'src/services/sessions.service';
import { Group, Session, User } from '../../../../../types/models';
import CurrentUserService from '../../services/current-user.service';
import GroupsService from '../../services/groups.service';
import SessionService from '../../services/session.service';

@Component({
    selector: 'app-sessions',
    templateUrl: 'sessions.component.html',
    styles: [],
})
export class SessionsComponent implements OnDestroy {
    createSessionForm = new FormGroup({
        sessionFrom: new FormControl('sessionFromGroup', { nonNullable: true, validators: [Validators.required] }),
        newSessionUsers: new FormControl<string[]>([], { nonNullable: true }),
        group: new FormControl('', { nonNullable: true }),
    });
    user$: Observable<User>;
    sessions$: Observable<Session[]>;
    groups$: Observable<Group[]>;
    friends$: Observable<User[]>;
    private sessionFormGroupSubscription: Subscription;

    constructor(
        private currentUserService: CurrentUserService,
        private sessionsService: SessionsService,
        private sessionService: SessionService,
        private groupsService: GroupsService,
        private friendsService: FriendsService
    ) {
        this.user$ = this.currentUserService.currentUserObservable();
        this.sessions$ = this.sessionsService.sessionsObservable();
        this.groups$ = this.groupsService.groupsObservable();
        this.sessionFormGroupSubscription = this.groups$.subscribe((groups) => {
            this.createSessionForm.patchValue({
                sessionFrom: groups.length == 0 ? 'sessionFromFriends' : 'sessionFromGroup',
            });
        });
        this.friends$ = this.friendsService.friendsObservable();
    }

    ngOnDestroy(): void {
        this.sessionFormGroupSubscription.unsubscribe();
    }

    newSession(): void {
        this.sessionService.createSession(this.createSessionForm.getRawValue()).subscribe(() => {
            this.sessionsService.refreshSessions();
        });
    }
}
