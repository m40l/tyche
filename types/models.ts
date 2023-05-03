export type Subscriptions = {
    xboxPCGamepass: boolean;
};

export interface Game {
    _id: string;
    appId: string;
    name: string;
    iconUrl: string;
    logoUrl: string;
    includedWith: Subscriptions;
}

export enum Platform {
    Steam = 'steam',
    None = 'none',
}

export interface CustomGame {
    name: string;
}
export type SessionGame = CustomGame | Game;

export interface SessionSettings {
    subscriptionsEnabled: Subscriptions;
}

export interface Session {
    _id: string;
    admins: User[];
    users: User[];
    commonGames: Game[];
    customGames: CustomGame[];
    bannedGames: Game[];
    chosenGame: SessionGame;
    allowUsers: {
        chooseGame: boolean;
        banGame: boolean;
        unbanGame: boolean;
        addCustomGame: boolean;
        deleteCustomGame: boolean;
        addUser: boolean;
        syncCommonGames: boolean;
        updateSettings: boolean;
    };
    everyoneHas: Subscriptions;
    settings: SessionSettings;
}

export interface OwnedGame {
    game: Game;
    platform: Platform;
}

export interface User {
    _id: string;
    username: string;
    email: string;
    googleUser: {
        id?: string;
    };
    steamUser?: {
        id: string;
        displayName: string;
    };
    friendCode: string;
    friends: User[];
    games: OwnedGame[];
    subscriptions: Subscriptions;
}

export interface Group {
    _id: string;
    name: string;
    joinCode: string;
    users: User[];
    admins: User[];
    sessions: Session[];
}
