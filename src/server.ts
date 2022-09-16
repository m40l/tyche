import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import passport from 'passport';
import mongoose from 'mongoose';
import session from 'express-session';
import path from 'path';
import MongoStore from 'connect-mongo';

import apiRouter from './api/api.routes';
import authRouter, { generateGoogleStrategy, generateSteamStrategy } from './api/auth.routes';

import User from './models/User';
import importSteamGames from './import-steam-games';
import assert from 'assert';
import eventsRouter from './api/events.routes';

main().catch((err) => console.error(err));

async function main() {
    // Load environment variables from the .env file
    dotenv.config();

    const { MONGO_URI, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, STEAM_API_KEY, SESSION_SECRET, SERVER_URL } =
        process.env;

    assert(MONGO_URI);
    assert(GOOGLE_CLIENT_ID);
    assert(GOOGLE_CLIENT_SECRET);
    assert(STEAM_API_KEY);
    assert(SESSION_SECRET);
    assert(SERVER_URL);

    await mongoose.connect(MONGO_URI);

    const app = express();

    app.use(cors());

    app.use(
        session({
            secret: SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            store: MongoStore.create({
                client: mongoose.connection.getClient(),
            }),
        })
    );

    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser((user, cb) => process.nextTick(() => cb(null, user)));
    passport.deserializeUser((userId, cb) => process.nextTick(() => User.findById(userId, cb)));

    app.use(passport.authenticate('session'));

    passport.use(
        generateGoogleStrategy({
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: `${SERVER_URL}/auth/google/callback`,
            scope: ['email', 'openid'],
        })
    );
    passport.use(
        generateSteamStrategy({
            apiKey: STEAM_API_KEY,
            returnURL: `${SERVER_URL}/auth/steam/callback`,
            realm: `${SERVER_URL}`,
        })
    );

    // importSteamGames();

    app.use('/auth', authRouter);
    app.use('/api', apiRouter);
    app.use('/sse', eventsRouter);

    const angularDir = path.join(__dirname, '../client/dist');
    app.use(express.static(angularDir));
    app.all('/*', (_req, res) => res.sendFile('index.html', { root: angularDir }));

    // start the Express server
    app.listen(5200, () => {
        console.log(`Server running at ${SERVER_URL}...`);
    });
}
