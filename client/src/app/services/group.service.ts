import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AddGroupRequest, LeaveGroupRequest } from '../../../../types/requests';

@Injectable({
    providedIn: 'root',
})
export default class GroupService {
    constructor(private httpClient: HttpClient) {}

    leaveGroup(leaveGroupRequest: LeaveGroupRequest): Observable<Object> {
        return this.httpClient.delete(`/api/groups/${leaveGroupRequest.groupId}`, {
            body: leaveGroupRequest,
        });
    }

    newGroup(addGroupRequest: AddGroupRequest): Observable<Object> {
        return this.httpClient.post(`/api/groups`, addGroupRequest);
    }
}
