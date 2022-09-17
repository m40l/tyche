import { Request, Response, Router } from 'express';
import { HydratedDocument } from 'mongoose';
import passport from 'passport';
import { Strategy as GoogleStrategy, StrategyOptions as GoogleStrategyOptions } from 'passport-google-oauth20';
import { Strategy as SteamStrategy } from 'passport-steam';
import User, { IUser } from '../models/User';

export const generateGoogleStrategy = (strategy: GoogleStrategyOptions) =>
    new GoogleStrategy(strategy, (_accessToken, _refreshToken, profile, cb): any =>
        User.findOneAndUpdate(
            {
                googleUser: {
                    id: profile.id,
                },
            },
            {
                $setOnInsert: {
                    email: profile._json.email,
                    username: profile._json.email,
                    googleUser: {
                        id: profile.id,
                    },
                },
            },
            {
                new: true,
                upsert: true,
            },
            (err, user) => {
                cb(err, user._id);
            }
        )
    );

export const generateSteamStrategy = (strategyOptions: { returnURL: string; realm: string; apiKey: string }) =>
    new SteamStrategy(
        { ...strategyOptions, passReqToCallback: true },
        (req: Request, _id: string, profile: any, cb: any) => {
            let user = req.user as HydratedDocument<IUser>;
            user.steamUser = {
                id: profile.id,
                displayName: profile.displayName,
            };
            user.save(cb);
        }
    );

export const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isUnauthenticated()) {
        return res.status(401).send();
    }
    next();
};

const googleAuthRouter = Router();
googleAuthRouter.get('/', passport.authenticate('google'));
googleAuthRouter.get(
    '/callback',
    passport.authenticate('google', {
        successReturnToOrRedirect: `/games`,
        failureRedirect: `/login`,
    })
);
const steamAuthRouter = Router();
steamAuthRouter.get('/', isAuthenticated, passport.authenticate('steam'));
steamAuthRouter.get(
    '/callback',
    isAuthenticated,
    passport.authenticate('steam', {
        successReturnToOrRedirect: `/games`,
        failureRedirect: `/login`,
    })
);

const authRouter = Router();
authRouter.use('/google', googleAuthRouter);
authRouter.use('/steam', steamAuthRouter);
authRouter.get('/logout', (req, res, next) => {
    req.logOut((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

export default authRouter;
