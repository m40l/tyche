import { SessionSettings } from './models';
import { CustomGame, Game, Subscriptions } from './models';

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
export interface AddSessionUserRequest {
    sessionId: string;
    userId: string;
}
export interface AddFriendRequest {
    friendCode: string;
}
export interface AddGroupRequest {
    name: string;
}
export interface LeaveGroupRequest {
    groupId: string;
}
export interface AddOffPlatformGameRequest {
    gameId: string;
}
export interface EditUserRequest {
    username?: string;
    subscriptions: Subscriptions;
}

export interface EditSessionSettings extends SessionSettings {
    sessionId: string;
}
