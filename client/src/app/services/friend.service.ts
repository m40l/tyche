import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AddFriendRequest } from '../../../../types/requests';
import { User } from '../../../../types/models';

@Injectable({
    providedIn: 'root',
})
export default class FriendService {
    constructor(private httpClient: HttpClient) {}

    newFriend(request: AddFriendRequest) {
        return this.httpClient.post<User>(`/api/friends/`, request);
    }
}
