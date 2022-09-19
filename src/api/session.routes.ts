import * as express from 'express';
import { HydratedDocument } from 'mongoose';
import User, { IUser } from '../models/User';
import Session, { ISession } from '../models/Session';
import assert from 'assert';
import Group from '../models/Group';
import _ from 'lodash';
import { Types } from 'mongoose';
import { IGame } from '../models/Game';
import {
    AddCustomGameRequest,
    AddSessionUserRequest,
    BanGameRequest,
    CreateSessionForm,
    DeleteGameRequest,
    UnbanGameRequest,
} from '../../types/requests';

const sessionRouter = express.Router();
sessionRouter.use(express.json());

sessionRouter.get('/', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;
    const sessions = (
        await user.populate<{ sessions: HydratedDocument<ISession>[] }>({
            path: 'sessions',
            populate: [
                {
                    path: 'users',
                    select: '_id username',
                },
                {
                    path: 'admins',
                    select: '_id username',
                },
            ],
        })
    ).sessions;
    return res.status(200).send(sessions);
});

sessionRouter.get('/:id', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;
    const session = await Session.findById(req.params.id).populate<{
        users: HydratedDocument<IUser>[];
        admins: HydratedDocument<IUser>[];
        commonGames: HydratedDocument<IGame>[];
        bannedGames: HydratedDocument<IGame>[];
    }>([
        {
            path: 'users',
            select: '_id username',
        },
        {
            path: 'admins',
            select: '_id username',
        },
        {
            path: 'commonGames',
            select: '_id name',
        },
        {
            path: 'bannedGames',
            select: '_id name',
        },
    ]);
    if (!session) {
        return res.status(404).send();
    }
    if (!_.some(session.users, (sessionUser) => sessionUser.equals(user))) {
        return res.status(404).send();
    }

    return res.status(200).send(session.toObject());
});

sessionRouter.post('/', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;
    const createSessionFrom = req.body as CreateSessionForm;
    if (createSessionFrom.sessionFrom == 'sessionFromFriends') {
        assert(createSessionFrom.newSessionUsers !== undefined);
        createSessionFrom.newSessionUsers.push(user.id);

        await Session.create({
            admins: [user.id],
            users: createSessionFrom.newSessionUsers,
        });
    } else {
        assert(createSessionFrom.group !== undefined);
        let group = await Group.findById(createSessionFrom.group).exec();
        if (!group) {
            return res.status(404).send();
        }

        await Session.create({
            admins: [user.id],
            users: group.users,
        });
    }

    return res.status(200).send();
});

sessionRouter.post('/:id/sync/games', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;
    const session = await Session.findById(req.params.id).populate<{ users: IUser[] }>({
        path: 'users',
        select: '_id games.game',
    });
    if (!session) {
        return res.status(404).send();
    }

    const usersGames = session.users.map((user) => _.map(user.games, 'game'));
    session.commonGames = _.intersectionWith(...usersGames, (a: Types.ObjectId, b: Types.ObjectId) => a.equals(b));
    await session.save();

    return res.status(200).send();
});

sessionRouter.delete('/:id/games', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;
    const session = await Session.findById(req.params.id);
    const deleteGameRequest = req.body as DeleteGameRequest;
    if (!session) {
        return res.status(404).send();
    }

    session.deleteCustomGame(deleteGameRequest.customGame);
    await session.save();
    return res.status(200).send();
});

sessionRouter.delete('/:id/games/:gameid', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;
    const session = await Session.findById(req.params.id);
    const banGameRequest = req.body as BanGameRequest;
    if (!session) {
        return res.status(404).send();
    }

    session.banGame(banGameRequest.game._id);
    await session.save();
    return res.status(200).send();
});

sessionRouter.post('/:id/games/:gameid', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;
    const session = await Session.findById(req.params.id);
    const unbanGameRequest = req.body as UnbanGameRequest;
    if (!session) {
        return res.status(404).send();
    }

    session.unbanGame(unbanGameRequest.game._id);
    await session.save();
    return res.status(200).send();
});

sessionRouter.post('/:id/games/', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;
    const session = await Session.findById(req.params.id);
    const addCustomGameRequest = req.body as AddCustomGameRequest;
    if (!session) {
        return res.status(404).send();
    }

    session.addCustomGame(addCustomGameRequest.customGame);
    await session.save();
    return res.status(200).send();
});

sessionRouter.post('/:id/users/:userId', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;
    const session = await Session.findById(req.params.id);
    if (!session) {
        return res.status(404).send();
    }
    const newUser = await User.findById(req.params.userId);
    if (!newUser) {
        return res.status(404).send();
    }
    const addSessionUserRequest = req.body as AddSessionUserRequest;

    session.addUser(addSessionUserRequest.userId);
    await session.save();
    return res.status(200).send();
});

sessionRouter.post('/:id/chooseGame', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;
    const session = await Session.findById(req.params.id);
    if (!session) {
        return res.status(404).send();
    }
    const chosenGame = await session.chooseGame();
    return res.status(200).send();
});

export default sessionRouter;
