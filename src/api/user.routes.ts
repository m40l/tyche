import * as express from 'express';
import { HydratedDocument } from 'mongoose';
import { EditUserRequest } from '../../types/requests';
import User, { IUser } from '../models/User';

const userRouter = express.Router();

userRouter.get('/current', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;
    res.status(200).send(user);
});

userRouter.patch('/current', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;
    const editUserRequest = req.body as EditUserRequest;

    await user.update(editUserRequest);
    res.status(200).send();
});

export default userRouter;
