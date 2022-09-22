import express from 'express';
import { isAuthenticated } from './auth.routes';
import gameRouter from './game.routes';
import userRouter from './user.routes';
import groupRouter from './group.routes';
import friendRouter from './friend.routes';
import sessionRouter from './session.routes';

const apiRouter = express.Router();
apiRouter.use(express.json());
apiRouter.use(isAuthenticated);
apiRouter.use('/games', gameRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/groups', groupRouter);
apiRouter.use('/friends', friendRouter);
apiRouter.use('/sessions', sessionRouter);
apiRouter.all('**', (_req, res) => res.status(404).send());

export default apiRouter;
