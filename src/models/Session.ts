import _ from 'lodash';
import { HydratedDocument, MergeType, model, PopulateOptions, Schema, Types } from 'mongoose';
import { session } from 'passport';
import { CustomGame, Session, SessionGame, SessionSettings } from '../../types/models';
import { IGame } from './Game';
import User, { IOwnedGame, IUser } from './User';

export interface ISession
    extends MergeType<
        Session,
        {
            _id: Types.ObjectId;
            admins: Types.ObjectId[];
            users: Types.ObjectId[];
            commonGames: Types.ObjectId[];
            bannedGames: Types.ObjectId[];
        }
    > {
    getSessionGames(): Promise<SessionGame[]>;
    chooseGame(): Promise<SessionGame>;
    banGame(game: HydratedDocument<IGame>): void;
    unbanGame(game: HydratedDocument<IGame>): void;
    addCustomGame(game: CustomGame): void;
    deleteCustomGame(game: CustomGame): void;
    addUser(user: HydratedDocument<IUser>): void;
    updateSettings(updateSettings: SessionSettings): void;
    can(
        user: HydratedDocument<IUser>,
        action:
            | 'getSession'
            | 'getSessionGames'
            | 'chooseGame'
            | 'banGame'
            | 'unbanGame'
            | 'addCustomGame'
            | 'deleteCustomGame'
            | 'addUser'
            | 'syncCommonGames'
            | 'updateSettings'
    ): boolean;
    syncCommonGames(): void;
}

export default model<ISession>(
    'Session',
    new Schema<ISession>(
        {
            admins: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
            ],
            users: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
            ],
            commonGames: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'Game',
                },
            ],
            customGames: [
                {
                    name: {
                        type: String,
                        required: true,
                    },
                },
            ],
            bannedGames: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'Game',
                    required: true,
                },
            ],
            chosenGame: {
                _id: Schema.Types.ObjectId,
                name: {
                    type: String,
                },
            },
            allowUsers: {
                chooseGame: { type: Boolean, default: true, required: true },
                banGame: { type: Boolean, default: true, required: true },
                unbanGame: { type: Boolean, default: true, required: true },
                addCustomGame: { type: Boolean, default: true, required: true },
                deleteCustomGame: { type: Boolean, default: true, required: true },
                addUser: { type: Boolean, default: true, required: true },
                syncCommonGames: { type: Boolean, default: true, required: true },
                updateSettings: { type: Boolean, default: false, required: true },
            },
            settings: {
                subscriptionsEnabled: {
                    xboxPCGamepass: {
                        type: Boolean,
                        default: false,
                        required: true,
                    },
                },
            },
        },
        {
            methods: {
                can(user: HydratedDocument<IUser>, action: string) {
                    const isSessionAdmin = _.some(this.admins, (sessionUser: HydratedDocument<IUser>) =>
                        sessionUser._id.equals(user._id)
                    );
                    const isSessionUser =
                        _.some(this.users, (sessionUser: HydratedDocument<IUser>) =>
                            sessionUser._id.equals(user._id)
                        ) || isSessionAdmin;

                    switch (action) {
                        case 'getSession':
                            return isSessionUser;
                        case 'getSessionGames':
                            return isSessionUser;
                        case 'chooseGame':
                            return this.allowUsers.chooseGame ? isSessionUser : isSessionAdmin;
                        case 'banGame':
                            return this.allowUsers.banGame ? isSessionUser : isSessionAdmin;
                        case 'unbanGame':
                            return this.allowUsers.unbanGame ? isSessionUser : isSessionAdmin;
                        case 'addCustomGame':
                            return this.allowUsers.addCustomGame ? isSessionUser : isSessionAdmin;
                        case 'deleteCustomGame':
                            return this.allowUsers.deleteCustomGame ? isSessionUser : isSessionAdmin;
                        case 'addUser':
                            return this.allowUsers.addUser ? isSessionUser : isSessionAdmin;
                        case 'syncCommonGames':
                            return this.allowUsers.syncCommonGames ? isSessionUser : isSessionAdmin;
                        case 'updateSettings':
                            return this.allowUsers.updateSettings ? isSessionUser : isSessionAdmin;
                        default:
                            return false;
                    }
                },
                async getSessionGames() {
                    const toPopulate: PopulateOptions[] = [];
                    if (!this.populated('commonGames')) {
                        toPopulate.push({
                            path: 'commonGames',
                            select: 'name',
                        });
                    }
                    if (!this.populated('bannedGames')) {
                        toPopulate.push({
                            path: 'bannedGames',
                            select: 'name',
                        });
                    }
                    let _this = await this.populate<{
                        commonGames: HydratedDocument<IGame>[];
                        bannedGames: HydratedDocument<IGame>[];
                    }>(toPopulate);

                    let allowedCommonGames: SessionGame[] = _this.commonGames.filter(
                        (commonGame: HydratedDocument<IGame>) =>
                            !_.some(_this.bannedGames, (bannedGame: HydratedDocument<IGame>) =>
                                commonGame.equals(bannedGame)
                            )
                    );
                    return allowedCommonGames.concat(this.customGames);
                },
                async chooseGame() {
                    const chosenGame = _.sample(await this.getSessionGames());
                    if (!chosenGame) {
                        return undefined;
                    }

                    this.chosenGame = chosenGame;
                    await this.save();
                    return chosenGame;
                },
                banGame(
                    this: MergeType<ISession, { bannedGames: HydratedDocument<IGame>[] }>,
                    game: HydratedDocument<IGame>
                ) {
                    this.bannedGames = _.unionWith(this.bannedGames, [game], (a, b) => a.equals(b));
                },
                unbanGame(
                    this: MergeType<ISession, { bannedGames: HydratedDocument<IGame>[] }>,
                    game: HydratedDocument<IGame>
                ) {
                    this.bannedGames = _.reject(this.bannedGames, (bannedGame) => bannedGame.equals(game));
                },
                addCustomGame(game: CustomGame) {
                    this.customGames = _.unionWith(this.customGames, [game], (a, b) => a.name == b.name);
                },
                deleteCustomGame(game: CustomGame) {
                    this.customGames = _.reject(this.customGames, (a) => a.name == game.name);
                },
                addUser(
                    this: MergeType<ISession, { users: HydratedDocument<IUser>[] }>,
                    user: HydratedDocument<IUser>
                ) {
                    this.users = _.unionWith(this.users, [user], (a, b) => a.equals(b));
                },
                syncCommonGames(
                    this: MergeType<
                        ISession,
                        {
                            users: HydratedDocument<
                                MergeType<
                                    IUser,
                                    {
                                        games: MergeType<
                                            IOwnedGame,
                                            {
                                                game: HydratedDocument<IGame>;
                                            }
                                        >[];
                                    }
                                >
                            >[];
                            commonGames: HydratedDocument<IGame>[];
                        }
                    >
                ) {
                    const usersGames = this.users.map((user) => _.map(user.games, 'game'));
                    this.commonGames = _.intersectionWith(...usersGames, (a: IGame, b: IGame) => a._id.equals(b._id));
                },
                async updateSettings(settings: SessionSettings) {
                    this.settings = settings;
                },
            },
            toJSON: { virtuals: true },
            toObject: { virtuals: true },
        }
    )
);
