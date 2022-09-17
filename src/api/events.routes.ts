import express from 'express';
import { filter } from 'rxjs';
import eventBus from '../events';
import Session from '../models/Session';

const eventsRouter = express.Router();

eventsRouter.use((_req, res, next) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE with client

    next();

    res.on('close', () => {
        res.end();
    });
});

eventsRouter.get('/sessions/:id', async (req, res) => {
    const session = await Session.findById(req.params.id);
    if (!session) {
        return res.end();
    }
    eventBus
        .pipe(filter((event) => event.id === req.params.id && event.model === 'Session'))
        .subscribe((sessionEvent) => {
            res.write(`data: ${JSON.stringify(sessionEvent)}\n\n`);
        });
});

export default eventsRouter;
