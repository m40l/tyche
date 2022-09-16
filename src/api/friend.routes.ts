import * as express from 'express';
import { HydratedDocument } from 'mongoose';
import User, { IUser } from '../models/User';

const friendRouter = express.Router();
friendRouter.use(express.json());

friendRouter.get('/', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;
    let friends = (await user.populate<{ friends: HydratedDocument<IUser>[] }>('friends')).friends;
    return res.status(200).send(friends);
});

friendRouter.post('/', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;

    const friend = await User.findOne({
        $or: [{ friendCode: req?.body?.search }, { email: req?.body?.search }],
    });
    if (!friend) {
        return res.status(404).send();
    }

    friend.friends.push(user._id);
    await friend.save();
    user.friends.push(friend._id);
    await user.save();

    res.status(200).send();
});

export default friendRouter;
