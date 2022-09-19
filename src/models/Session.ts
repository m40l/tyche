import _ from 'lodash';
import { HydratedDocument, model, PopulateOptions, Schema, Types } from 'mongoose';
import { ChooseGameEvent } from '../../types/events';
import { CustomGame, SessionGame, User } from '../../types/models';
import eventBus from '../events';
import { IGame } from './Game';

export interface ISession {
    _id: Types.ObjectId;
    admins: Types.ObjectId[];
    users: Types.ObjectId[];
    commonGames: Types.ObjectId[];
    customGames: CustomGame[];
    bannedGames: Types.ObjectId[];
    chosenGame: SessionGame;
    getSessionGames(): Promise<SessionGame[]>;
    chooseGame(): Promise<SessionGame>;
    banGame(gameId: string): void;
    unbanGame(gameId: string): void;
    addCustomGame(game: CustomGame): void;
    deleteCustomGame(game: CustomGame): void;
    addUser(userId: string): void;
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
                },
            ],
            chosenGame: {
                _id: Schema.Types.ObjectId,
                name: {
                    type: String,
                },
            },
        },
        {
            methods: {
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
                    eventBus.next(new ChooseGameEvent(this._id.toHexString(), chosenGame));
                    return chosenGame;
                },
                banGame(gameId: string) {
                    const game = new Types.ObjectId(gameId);
                    this.bannedGames = _.unionWith(this.bannedGames, [game], (a, b) => a.equals(b));
                },
                unbanGame(gameId: string) {
                    const unbannedGame = new Types.ObjectId(gameId);
                    this.bannedGames = _.reject(this.bannedGames, (bannedGame) => bannedGame.equals(unbannedGame));
                },
                addCustomGame(game: CustomGame) {
                    this.customGames = _.unionWith(this.customGames, [game], (a, b) => a.name == b.name);
                },
                deleteCustomGame(game: CustomGame) {
                    this.customGames = _.reject(this.customGames, (a) => a.name == game.name);
                },
                addUser(userId: string) {
                    const user = new Types.ObjectId(userId);
                    this.users = _.unionWith(this.users, [user], (a, b) => a.equals(b));
                },
            },
            toJSON: { virtuals: true },
            toObject: { virtuals: true },
        }
    )
);
