import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root',
})
export default class FriendService {
    constructor(private httpClient: HttpClient) {}

    newFriend(search: string) {
        return this.httpClient.post(`/api/friends/`, {
            search,
        });
    }
}
