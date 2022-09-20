export interface Game {
    _id: string;
    appId: string;
    name: string;
    iconUrl: string;
    logoUrl: string;
}

export enum Platform {
    Steam = 'steam',
    None = 'none',
}

export interface CustomGame {
    name: string;
}
export type SessionGame = CustomGame | Game;

export interface Session {
    _id: string;
    admins: User[];
    users: User[];
    commonGames: Game[];
    customGames: CustomGame[];
    bannedGames: Game[];
    chosenGame: SessionGame;
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
}

export interface Group {
    _id: string;
    name: string;
    joinCode: string;
    users: User[];
    admins: User[];
    sessions: Session[];
}
