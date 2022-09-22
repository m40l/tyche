import * as express from 'express';
import { HydratedDocument } from 'mongoose';
import User, { IUser } from '../models/User';

const userRouter = express.Router();

userRouter.get('/current', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;
    res.status(200).send(user);
});

export default userRouter;
