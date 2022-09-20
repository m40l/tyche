import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
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
    newGroupName = new FormControl('', { nonNullable: true });
    newFriendCode = new FormControl('', { nonNullable: true });
    memberSearch = new FormControl('', { nonNullable: true });

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

    newFriend(): void {
        this.friendService.newFriend({ friendCode: this.newFriendCode.value }).subscribe(() => {
            this.newFriendCode.reset();
            this.friendsService.refreshFriends();
        });
    }

    removeFriend(user: User): void {
        //TODO
    }

    newGroup(): void {
        this.groupService.newGroup({ name: this.newGroupName.value }).subscribe(() => {
            this.newGroupName.reset();
            this.groupsService.refreshGroups();
        });
    }

    leaveGroup(group: Group): void {
        this.groupService.leaveGroup({ groupId: group._id }).subscribe(() => this.groupsService.refreshGroups());
    }

    removeMember(user: User): void {
        //TODO
    }
}
