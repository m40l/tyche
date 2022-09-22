import randomWords from 'random-words';
import { HydratedDocument, MergeType, model, Schema, Types } from 'mongoose';
import { OwnedGame, Platform, User } from '../../types/models';
import SteamClient from '../clients/steam-client';
import Game from './Game';
import _ from 'lodash';

const generateFriendCode = () => randomWords({ exactly: 4, join: ' ' });

export interface IOwnedGame extends MergeType<OwnedGame, { game: Types.ObjectId }> {}

export interface IUser
    extends MergeType<
        User,
        {
            _id: Types.ObjectId;
            friends: Types.ObjectId[];
            games: IOwnedGame[];
        }
    > {
    generateNewFriendCode(): void;
    setSteamUser(steamProfile: any): Promise<void>;
    syncSteamGames(): Promise<void>;
    befriend(userId: Types.ObjectId): void;
    addCustomGame(gameId: string): void;
}

let UserSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        googleUser: {
            id: {
                type: String,
                unique: true,
            },
        },
        steamUser: {
            id: {
                type: String,
                unique: true,
                sparse: true,
            },
            displayName: {
                type: String,
            },
        },
        friendCode: {
            type: String,
            unique: true,
            default: generateFriendCode,
        },
        friends: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        games: [
            {
                game: {
                    type: Schema.Types.ObjectId,
                    ref: 'Game',
                },
                platform: {
                    type: String,
                    enum: [Platform.Steam, Platform.None],
                    default: 'none',
                },
            },
        ],
    },
    {
        methods: {
            generateNewFriendCode() {
                this.friendCode = generateFriendCode();
            },
            async setSteamUser(steamProfile: any) {
                this.steamUser = {
                    id: steamProfile.id,
                    displayName: steamProfile.displayName,
                };
                await this.syncSteamGames();
            },
            async syncSteamGames() {
                if (!this.steamUser) {
                    throw new Error('User must have steam user to sync with steam');
                }
                let steam = new SteamClient();
                const steamGames = await steam.getOwnedGames({
                    steamid: this.steamUser.id,
                    include_appinfo: true,
                    include_played_free_games: true,
                });
                await Game.bulkWrite(
                    steamGames.response.games.map((game) => ({
                        updateOne: {
                            filter: { appId: game.appid },
                            update: {
                                $set: {
                                    name: game.name,
                                    iconUrl: game.img_icon_url,
                                    logoUrl: game.img_logo_url,
                                },
                                $setOnInsert: {
                                    appId: game.appid,
                                },
                            },
                            upsert: true,
                        },
                    }))
                );
                const ownedGamesModels = await Game.find(
                    {
                        appId: { $in: steamGames.response.games.map((game) => game.appid) },
                    },
                    '_id'
                );

                let existingOwnedGames: IOwnedGame[] = [...this.games];

                this.games = existingOwnedGames
                    .filter((game) => game.platform !== Platform.Steam)
                    .concat(
                        ownedGamesModels.map((gameModel) => ({
                            game: gameModel._id,
                            platform: Platform.Steam,
                        }))
                    );
            },
            befriend(user: HydratedDocument<IUser>) {
                this.friends = _.unionWith(this.friends, [user._id], (a, b) => a.equals(b));
            },
            addCustomGame(gameId: string) {
                const game = new Types.ObjectId(gameId);
                this.games = _.unionWith(
                    this.games,
                    [
                        {
                            game,
                            platform: Platform.None,
                        },
                    ],
                    (a, b) => a.game.equals(b.game)
                );
            },
        },
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

UserSchema.virtual('sessions', {
    ref: 'Session',
    localField: '_id',
    foreignField: 'users',
});
UserSchema.virtual('groups', {
    ref: 'Group',
    localField: '_id',
    foreignField: 'users',
});
UserSchema.virtual('steamGames', {
    get() {
        return this.games
            .filter((game: IOwnedGame) => game.platform === Platform.Steam)
            .map((game: IOwnedGame) => game.game);
    },
});

export default model<IUser>('User', UserSchema);
