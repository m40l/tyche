import { model, Schema, Types } from 'mongoose';
import { Game } from '../../types/models';

export interface IGame extends Omit<Game, '_id'> {
    _id: Types.ObjectId;
}

export default model<IGame>(
    'Game',
    new Schema<IGame>({
        appId: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
            text: true,
        },
        iconUrl: {
            type: String,
        },
        logoUrl: {
            type: String,
        },
    })
);
