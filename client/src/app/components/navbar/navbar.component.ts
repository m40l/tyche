import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../../../../types/models';
import CurrentUserService from '../../services/current-user.service';

@Component({
    selector: 'app-navbar',
    templateUrl: 'navbar.component.html',
    styles: [],
})
export class NavbarComponent {
    user$: Observable<User>;
    constructor(private currentUserService: CurrentUserService) {
        this.user$ = this.currentUserService.currentUserObservable();
    }
}
