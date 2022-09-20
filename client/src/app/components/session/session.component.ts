import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { map, mergeMap, Observable, Subject, Subscription } from 'rxjs';
import { SessionEvent } from '../../../../../types/events';
import { CustomGame, Game, Session, User } from '../../../../../types/models';
import FriendsService from '../../services/friends.service';
import SessionService from '../../services/session.service';

@Component({
    selector: 'app-session',
    templateUrl: 'session.component.html',
    styles: [],
})
export class SessionComponent implements OnInit, OnDestroy {
    public sessionId!: string;
    public session$!: Observable<Session>;
    public sessionEvents$!: Observable<SessionEvent>;
    public allowedCommonGames$!: Observable<Game[]>;
    public addableFriends$!: Observable<User[]>;
    public customGameName = new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
    });

    public newSessionUser = new FormControl('', { nonNullable: true });

    private subscriptions: Subscription[] = [];

    constructor(
        private route: ActivatedRoute,
        private sessionService: SessionService,
        private friendsService: FriendsService
    ) {}

    ngOnInit(): void {
        this.sessionId = this.route.snapshot.params['id'];
        const { session$, sessionEvents$ } = this.sessionService.getSessionObservables(this.sessionId);
        this.session$ = session$;
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
        this.sessionEvents$ = sessionEvents$;
        this.subscriptions = [
            this.sessionEvents$.subscribe((event) => {
                if (event.event == 'ChooseGameEvent') {
                    $('#chooseGameNotification').modal('show');
                }
            }),
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

    syncGames() {
        this.sessionService.syncSessionGames(this.sessionId).subscribe();
    }

    chooseGame() {
        this.sessionService.chooseGame(this.sessionId).subscribe();
    }

    deleteGame(customGame: CustomGame) {
        this.sessionService.deleteGame({ sessionId: this.sessionId, customGame }).subscribe();
    }

    banGame(game: Game) {
        this.sessionService.banGame({ sessionId: this.sessionId, game }).subscribe();
    }

    unbanGame(game: Game) {
        this.sessionService.unbanGame({ sessionId: this.sessionId, game }).subscribe();
    }

    addCustomGame() {
        this.sessionService
            .addCustomGame({ sessionId: this.sessionId, customGame: { name: this.customGameName.value } })
            .subscribe();
    }

    addSessionUser() {
        this.sessionService
            .addSessionUser({ sessionId: this.sessionId, userId: this.newSessionUser.value })
            .subscribe(() => this.newSessionUser.reset());
    }
}
