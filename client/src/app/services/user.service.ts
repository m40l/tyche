import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../../../types/models';

@Injectable({
    providedIn: 'root',
})
export default class UserService {
    constructor(private httpClient: HttpClient) {}

    getUser(id: string): Observable<User> {
        return this.httpClient.get<User>(`/api/users/${id}`);
    }
}
