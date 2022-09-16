import randomWords from 'random-words';
import { model, Schema, Types } from 'mongoose';
import { Group } from '../../types/models';

const generateJoinCode = () => randomWords({ exactly: 4, join: ' ' });

export interface IGroup extends Omit<Group, '_id' | 'users' | 'admins' | 'sessions'> {
    _id: Types.ObjectId;
    users: Types.ObjectId[];
    admins: Types.ObjectId[];
    sessions: Types.ObjectId[];
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
                generateNewJoinCode(cb) {
                    this.joinCode = generateJoinCode();
                    cb();
                },
            },
        }
    )
);
