import express from 'express';
import { isAuthenticated } from './auth.routes';
import gameRouter from './game.routes';
import userRouter from './user.routes';
import groupRouter from './group.routes';
import friendRouter from './friend.routes';
import sessionRouter from './session.routes';

const apiRouter = express.Router();

apiRouter.use('/games', isAuthenticated, gameRouter);
apiRouter.use('/users', isAuthenticated, userRouter);
apiRouter.use('/groups', isAuthenticated, groupRouter);
apiRouter.use('/friends', isAuthenticated, friendRouter);
apiRouter.use('/sessions', isAuthenticated, sessionRouter);
apiRouter.all('**', (_req, res) => res.status(404).send());

export default apiRouter;
