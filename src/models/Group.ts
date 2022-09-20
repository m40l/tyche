import randomWords from 'random-words';
import { HydratedDocument, MergeType, model, Schema, Types } from 'mongoose';
import { Group } from '../../types/models';
import _ from 'lodash';

const generateJoinCode = () => randomWords({ exactly: 4, join: ' ' });

export interface IGroup
    extends MergeType<
        Group,
        {
            _id: Types.ObjectId;
            users: Types.ObjectId[];
            admins: Types.ObjectId[];
            sessions: Types.ObjectId[];
        }
    > {
    generateNewJoinCode(): void;
    addUser(userId: string): void;
    removeUser(userId: string): void;
}

export default model<IGroup>(
    'Group',
    new Schema<IGroup>(
        {
            name: {
                type: String,
                required: true,
            },
            joinCode: {
                type: String,
                unique: true,
                default: generateJoinCode,
            },
            users: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
            ],
            admins: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
            ],
            sessions: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'Session',
                },
            ],
        },
        {
            methods: {
                generateNewJoinCode() {
                    this.joinCode = generateJoinCode();
                },
                addUser(userId: string) {
                    const user = new Types.ObjectId(userId);
                    this.users = _.unionWith(this.users, [user], (a, b) => a.equals(b));
                },
                removeUser(userId: string) {
                    const user = new Types.ObjectId(userId);
                    this.users = _.reject(this.users, (a) => a.equals(user));
                },
            },
        }
    )
);
