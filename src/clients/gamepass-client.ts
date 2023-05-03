import qs from 'qs';
import https from 'https';

interface GamepassGame {
    id: string;
}

interface PopulatedGamepassGame {
    ProductId: string;
    LocalizedProperties: {
        ProductDescription: string;
        ProductTitle: string;
        ShortTitle: string;
        Images: {
            ImagePurpose: string;
            Uri: string;
        }[];
    }[];
}
interface GamepassResponseDetails {
    siglId: string;
    title: string;
    description: string;
    requiresShuffling: string;
    imageUrl: string;
}
interface GamepassResponse {
    details: GamepassResponseDetails;
    games: GamepassGame[];
}
/**
 * https://www.reddit.com/r/XboxGamePass/comments/jt214y/comment/gwcyl86/
 */
export default class GamepassClient {
    private host = '';
    async getPCGamepassGames() {
        return this.getGamepassGames({
            id: 'fdd9e2a7-0fee-49f6-ad69-4354098401ff',
            language: 'en-us',
            market: 'US',
        });
    }

    private async getGamepassGames(request: {
        id: string;
        language: string;
        market: string;
    }): Promise<GamepassResponse> {
        return new Promise((resolve, reject) => {
            https
                .get(
                    {
                        host: 'catalog.gamepass.com',
                        port: 443,
                        path: '/sigls/v2?' + qs.stringify(request),
                    },
                    (res) => {
                        let data = '';
                        const statusCode = res.statusCode;
                        res.on('data', (chunk) => (data += chunk));
                        res.on('end', () => {
                            if (statusCode === 404) {
                                reject(404);
                                return;
                            } else if (statusCode === 403) {
                                reject(403);
                                return;
                            }

                            let dataJson: any[];
                            try {
                                dataJson = JSON.parse(data);
                            } catch (e) {
                                reject('JSON Invalid' + e + data);
                                return;
                            }

                            if (statusCode && statusCode >= 400 && statusCode < 500) {
                                reject(dataJson);
                                return;
                            }

                            const details: GamepassResponseDetails = dataJson.shift();
                            const games: GamepassGame[] = dataJson;
                            resolve({
                                details,
                                games,
                            });
                        });
                    }
                )
                .on('error', reject);
        });
    }

    async getGamepassGamesDetails(ids: string[]): Promise<PopulatedGamepassGame[]> {
        return new Promise((resolve, reject) => {
            https
                .get(
                    {
                        host: 'displaycatalog.mp.microsoft.com',
                        port: 443,
                        path:
                            '/v7.0/products?' +
                            qs.stringify({
                                bigIds: ids.join(','),
                                market: 'US',
                                languages: 'en-us',
                                'MS-CV': 'DGU1mcuYo0WMMp+F.1',
                            }),
                    },
                    (res) => {
                        let data = '';
                        const statusCode = res.statusCode;
                        res.on('data', (chunk) => (data += chunk));
                        res.on('end', () => {
                            if (statusCode === 404) {
                                reject(404);
                                return;
                            } else if (statusCode === 403) {
                                reject(403);
                                return;
                            }

                            let dataJson;
                            try {
                                dataJson = JSON.parse(data);
                            } catch (e) {
                                reject('JSON Invalid' + e + data);
                            }

                            if (statusCode && statusCode >= 400 && statusCode < 500) {
                                reject(dataJson);
                                return;
                            }

                            if (dataJson.Products === undefined) {
                                reject(dataJson);
                            }

                            resolve(dataJson.Products);
                        });
                    }
                )
                .on('error', reject);
        });
    }
}
