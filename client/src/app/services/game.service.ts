import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, Subject, throttleTime } from 'rxjs';
import { Game, OwnedGame } from '../../../../types/models';
import { AddOffPlatformGameRequest } from '../../../../types/requests';

@Injectable({
    providedIn: 'root',
})
export default class GameService {
    constructor(private httpClient: HttpClient) {}

    syncFromSteam(): Observable<object> {
        return this.httpClient.post(`/api/games/sync/steam`, {});
    }

    searchGames(search: string) {
        return this.httpClient.get<Game[]>(`/api/games/search`, {
            params: {
                search,
            },
        });
    }

    addGame(addOffPlatformGameRequest: AddOffPlatformGameRequest): Observable<object> {
        return this.httpClient.post(`/api/games/`, addOffPlatformGameRequest);
    }
}
