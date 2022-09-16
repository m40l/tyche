import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import FriendService from 'src/services/friend.service';
import GroupService from 'src/services/group.service';
import UserService from 'src/services/user.service';
import { Group, User } from '../../../../../types/models';
import CurrentUserService from '../../services/current-user.service';
import FriendsService from '../../services/friends.service';
import GroupsService from '../../services/groups.service';

@Component({
    selector: 'app-groups',
    templateUrl: 'groups.component.html',
    styles: [],
})
export class GroupsComponent {
    user$ = new Observable<User>();
    groups$ = new Observable<Group[]>();
    friends$ = new Observable<User[]>();
    selectedGroup?: Group;
    newGroupName = '';
    newFriendSearch = '';
    memberSearch = '';

    constructor(
        private currentUserService: CurrentUserService,
        private groupService: GroupService,
        private groupsService: GroupsService,
        private friendService: FriendService,
        private friendsService: FriendsService
    ) {
        this.user$ = this.currentUserService.currentUserObservable();
        this.groups$ = this.groupsService.groupsObservable();
        this.friends$ = this.friendsService.friendsObservable();
    }

    newGroup(): void {
        this.groupService.newGroup(this.newGroupName).subscribe(() => this.groupsService.refreshGroups());
    }

    leaveGroup(id: string): void {
        this.groupService.leaveGroup(id).subscribe(() => this.groupsService.refreshGroups());
    }

    removeMember(id: string): void {
        //TODO
    }

    newFriend(): void {
        this.friendService.newFriend(this.newFriendSearch).subscribe(() => this.friendsService.refreshFriends());
    }

    removeFriend(id: string): void {
        //TODO
    }
}
