import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AddFriendRequest } from '../../../../types/requests';

@Injectable({
    providedIn: 'root',
})
export default class FriendService {
    constructor(private httpClient: HttpClient) {}

    newFriend(request: AddFriendRequest) {
        return this.httpClient.post(`/api/friends/`, request);
    }
}
