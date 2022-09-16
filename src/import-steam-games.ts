import Game from './models/Game';
import SteamClient from './clients/steam-client';

export default async function importSteamGames() {
    const steam = new SteamClient();
    console.log('Importing SteamApp list');
    let response = await steam.getAppList();
    console.log(`Updating Game Documents (Found ${response.applist.apps.length})`);
    await Game.bulkWrite(
        response.applist.apps.map((game) => ({
            updateOne: {
                filter: { appId: game.appid },
                update: {
                    $set: {
                        name: game.name,
                    },
                    $setOnInsert: {
                        appId: game.appid,
                    },
                },
                upsert: true,
            },
        }))
    );
    console.log('SteamApps Imported');
}
