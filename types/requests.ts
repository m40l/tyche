import { CustomGame, Game } from './models';

export interface DeleteGameRequest {
    sessionId: string;
    customGame: CustomGame;
}
export interface BanGameRequest {
    sessionId: string;
    game: Game;
}
export interface UnbanGameRequest {
    sessionId: string;
    game: Game;
}
export interface CreateSessionForm {
    sessionFrom: string;
    newSessionUsers?: string[];
    group?: string;
}

export interface AddCustomGameRequest {
    sessionId: string;
    customGame: CustomGame;
}
