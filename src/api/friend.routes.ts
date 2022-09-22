import * as express from 'express';
import { HydratedDocument } from 'mongoose';
import { AddFriendRequest } from '../../types/requests';
import User, { IUser } from '../models/User';

const friendRouter = express.Router();

friendRouter.get('/', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;
    let friends = (await user.populate<{ friends: HydratedDocument<IUser>[] }>('friends')).friends;
    return res.status(200).send(friends);
});

friendRouter.post('/', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;
    const addFriendRequest = req.body as AddFriendRequest;

    const friend = await User.findOne({ friendCode: addFriendRequest.friendCode.trim() });
    if (!friend) {
        return res.status(404).send();
    }

    friend.befriend(user._id);
    await friend.save();
    user.befriend(friend._id);
    await user.save();

    res.status(200).send(friend);
});

export default friendRouter;
