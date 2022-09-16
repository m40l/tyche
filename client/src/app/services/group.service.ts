import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export default class GroupService {
    constructor(private httpClient: HttpClient) {}

    leaveGroup(id: string): Observable<Object> {
        return this.httpClient.delete(`/api/groups/${id}`);
    }

    newGroup(groupName: string): Observable<Object> {
        return this.httpClient.post(`/api/groups`, { name: groupName });
    }
}
