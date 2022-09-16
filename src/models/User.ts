import randomWords from 'random-words';
import { model, Schema, Types } from 'mongoose';
import { OwnedGame, Platform, User } from '../../types/models';

const generateFriendCode = () => randomWords({ exactly: 4, join: ' ' });

export interface IOwnedGame extends Omit<OwnedGame, 'game'> {
    game: Types.ObjectId;
}

export interface IUser extends Omit<User, '_id' | 'friends' | 'games'> {
    _id: Types.ObjectId;
    friends: Types.ObjectId[];
    games: IOwnedGame[];
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
            generateNewFriendCode(cb) {
                this.friendCode = generateFriendCode();
                cb();
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
