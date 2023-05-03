import assert from 'assert';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import importPCGamepassGames from './jobs/import-pcgamepass-games';
import importSteamGames from './jobs/import-steam-games';
import Game from './models/Game';

deploy();

async function deploy() {
    dotenv.config();

    const { MONGO_URI } = process.env;

    assert(MONGO_URI);

    await mongoose.connect(MONGO_URI);

    await importSteamGames();
    await importPCGamepassGames();
    mongoose.connection.db.stats((err, results) => console.log(results?.storageSize));
}
