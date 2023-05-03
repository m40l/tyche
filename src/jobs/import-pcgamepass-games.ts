import Game from '../models/Game';
import GamepassClient from '../clients/gamepass-client';

export default async function importPCGamepassGames() {
    const gamepass = new GamepassClient();
    console.log('Importing PC Gamepass list');
    const listResponse = await gamepass.getPCGamepassGames();
    console.log('Found %d Games, Importing PC Gamepass games details', listResponse.games.length);
    const detailsResponse = await gamepass.getGamepassGamesDetails(listResponse.games.map((game) => game.id));
    console.log(`Updating Game Documents`);
    await Game.updateMany(
        {},
        {
            includedWith: {
                pcXboxGamepass: false,
            },
        }
    );
    await Game.bulkWrite(
        detailsResponse.map((game) => ({
            updateOne: {
                filter: { appId: game.ProductId },
                update: {
                    $set: {
                        name: game.LocalizedProperties[0].ProductTitle,
                        includedWith: {
                            xboxPCGamepass: true,
                        },
                    },
                    $setOnInsert: {
                        appId: game.ProductId,
                    },
                },
                upsert: true,
            },
        }))
    );
    console.log('PC Gamepass Games Imported');
}
