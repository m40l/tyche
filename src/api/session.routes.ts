import * as express from 'express';
import { HydratedDocument, MergeType } from 'mongoose';
import User, { IOwnedGame, IUser } from '../models/User';
import Session, { ISession } from '../models/Session';
import assert from 'assert';
import Group from '../models/Group';
import _ from 'lodash';
import Game, { IGame } from '../models/Game';
import {
    AddCustomGameRequest,
    BanGameRequest,
    CreateSessionForm,
    DeleteGameRequest,
    UnbanGameRequest,
} from '../../types/requests';
import eventBus from '../events';
import { ChooseGameEvent, UpdateSessionEvent } from '../../types/events';

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
    if (!session.can(user, 'getSession')) {
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
    const session = await Session.findById(req.params.id).populate<{
        users: HydratedDocument<
            MergeType<IUser, { games: MergeType<IOwnedGame, { game: HydratedDocument<IGame> }>[] }>
        >[];
        admins: HydratedDocument<IUser>[];
        commonGames: HydratedDocument<IGame>[];
        bannedGames: HydratedDocument<IGame>[];
    }>([
        {
            path: 'users',
            select: '_id username games.game',
            populate: {
                path: 'games.game',
                select: '_id name',
            },
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
    if (!session.can(user, 'syncCommonGames')) {
        return res.status(403).send();
    }
    session.syncCommonGames();
    await session.save();
    eventBus.next(new UpdateSessionEvent(session.id, session.toObject()));

    return res.status(200).send();
});

sessionRouter.delete('/:id/games', async (req, res) => {
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
    const deleteGameRequest = req.body as DeleteGameRequest;
    if (!session) {
        return res.status(404).send();
    }
    if (!session.can(user, 'deleteCustomGame')) {
        return res.status(403).send();
    }

    session.deleteCustomGame(deleteGameRequest.customGame);
    await session.save();
    eventBus.next(new UpdateSessionEvent(session.id, session.toObject()));
    return res.status(200).send();
});

sessionRouter.delete('/:id/games/:gameid', async (req, res) => {
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
    const banGameRequest = req.body as BanGameRequest;
    if (!session) {
        return res.status(404).send();
    }
    if (!session.can(user, 'banGame')) {
        return res.status(403).send();
    }

    const bannedGame = await Game.findById(banGameRequest.game._id);
    if (!bannedGame) {
        return res.status(404).send();
    }

    session.banGame(bannedGame);
    await session.save();
    eventBus.next(new UpdateSessionEvent(session.id, session.toObject()));
    return res.status(200).send();
});

sessionRouter.post('/:id/games/:gameid', async (req, res) => {
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
    const unbanGameRequest = req.body as UnbanGameRequest;
    if (!session) {
        return res.status(404).send();
    }
    if (!session.can(user, 'unbanGame')) {
        return res.status(403).send();
    }

    const unbannedGame = await Game.findById(unbanGameRequest.game._id);
    if (!unbannedGame) {
        return res.status(404).send();
    }

    session.unbanGame(unbannedGame);
    await session.save();
    eventBus.next(new UpdateSessionEvent(session.id, session.toObject()));
    return res.status(200).send();
});

sessionRouter.post('/:id/games/', async (req, res) => {
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
    const addCustomGameRequest = req.body as AddCustomGameRequest;
    if (!session) {
        return res.status(404).send();
    }
    if (!session.can(user, 'addCustomGame')) {
        return res.status(403).send();
    }

    session.addCustomGame(addCustomGameRequest.customGame);
    await session.save();
    eventBus.next(new UpdateSessionEvent(session.id, session.toObject()));
    return res.status(200).send();
});

sessionRouter.post('/:id/users/:userId', async (req, res) => {
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
    if (!session.can(user, 'addUser')) {
        return res.status(403).send();
    }

    const newUser = await User.findById(req.params.userId);
    if (!newUser) {
        return res.status(404).send();
    }

    session.addUser(newUser);
    await session.save();
    eventBus.next(new UpdateSessionEvent(session.id, session.toObject()));
    return res.status(200).send();
});

sessionRouter.post('/:id/chooseGame', async (req, res) => {
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
    if (!session.can(user, 'chooseGame')) {
        return res.status(403).send();
    }
    const chosenGame = await session.chooseGame();
    eventBus.next(new UpdateSessionEvent(session.id, session.toObject()));
    eventBus.next(new ChooseGameEvent(session.id, chosenGame));
    return res.status(200).send();
});

export default sessionRouter;
