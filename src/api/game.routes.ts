import * as express from 'express';
import _ from 'lodash';
import { HydratedDocument } from 'mongoose';
import { AddOffPlatformGameRequest } from '../../types/requests';
import Game, { IGame } from '../models/Game';
import { IUser } from '../models/User';

const gameRouter = express.Router();

gameRouter.get('/', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;
    let games = (
        await user.populate<{ games: HydratedDocument<IGame>[] }>({
            path: 'games',
            populate: {
                path: 'game',
            },
        })
    ).games;
    return res.status(200).send(games);
});

gameRouter.post('/', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;
    const addOffPlatformGameRequest = req.body as AddOffPlatformGameRequest;
    user.addCustomGame(addOffPlatformGameRequest.gameId);
    await user.save();
    return res.status(200).send();
});

gameRouter.post('/sync/steam', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;
    if (user.steamUser?.id === undefined) {
        return res.status(401).send();
    }
    await user.syncSteamGames();
    await user.save();
    return res.status(200).send();
});

gameRouter.get('/search', async (req, res) => {
    const user = req.user as HydratedDocument<IUser>;
    const params = req.query as {
        search: string;
    };
    const results = await Game.find({
        _id: {
            $not: {
                $in: user.games.map((game) => game.game),
            },
        },
        $text: {
            $search: params.search,
        },
    })
        .sort({ score: { $meta: 'textScore' } })
        .limit(5);

    return res.status(200).send(results);
});

export default gameRouter;
