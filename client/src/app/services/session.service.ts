import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { fromEvent, map, Observable } from 'rxjs';
import {
    AddCustomGameRequest,
    BanGameRequest,
    CreateSessionForm,
    DeleteGameRequest,
    UnbanGameRequest,
} from '../../../../types/requests';
import { Session } from '../../../../types/models';
import { SessionEvent } from '../../../../types/events';

@Injectable({
    providedIn: 'root',
})
export default class SessionService {
    constructor(private httpClient: HttpClient) {}

    getSession(id: string): Observable<Session> {
        return this.httpClient.get<Session>(`/api/sessions/${id}`);
    }

    getSessionEvents(id: string): Observable<SessionEvent> {
        const es = new EventSource(`/sse/sessions/${id}`);
        return fromEvent<MessageEvent>(es, 'message').pipe(map((event) => JSON.parse(event.data)));
    }

    createSession(createSessionForm: CreateSessionForm): Observable<Object> {
        return this.httpClient.post(`/api/sessions/`, createSessionForm);
    }

    syncSessionGames(id: string): Observable<Object> {
        return this.httpClient.post(`/api/sessions/${id}/sync/games`, {});
    }

    chooseGame(id: string) {
        return this.httpClient.post(`/api/sessions/${id}/chooseGame`, {});
    }

    deleteGame(request: DeleteGameRequest) {
        return this.httpClient.delete(`/api/sessions/${request.sessionId}/games`, {
            body: request,
        });
    }

    banGame(request: BanGameRequest) {
        return this.httpClient.delete(`/api/sessions/${request.sessionId}/games/${request.game._id}`, {
            body: request,
        });
    }

    unbanGame(request: UnbanGameRequest) {
        return this.httpClient.post(`/api/sessions/${request.sessionId}/games/${request.game._id}`, request);
    }

    addCustomGame(request: AddCustomGameRequest) {
        return this.httpClient.post(`/api/sessions/${request.sessionId}/games`, request);
    }
}
