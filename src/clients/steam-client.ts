import qs from 'qs';
import http from 'http';
import assert from 'assert';

interface SteamApp {
    appid: string;
    name: string;
}

interface PopulatedSteamApp extends SteamApp {
    img_icon_url: string;
    img_logo_url: string;
}
/**
 * This is mostly a copy of steam-web, but typed and promise-based and debuggable
 */
export default class SteamClient {
    apiKey: string;
    /**
     * dotconfig must have been loaded
     */
    constructor() {
        const { STEAM_API_KEY } = process.env;
        assert(STEAM_API_KEY);
        this.apiKey = STEAM_API_KEY;
    }

    getOwnedGames(options: { steamid: string; include_appinfo: boolean; include_played_free_games: boolean }): Promise<{
        response: {
            game_count: number;
            games: PopulatedSteamApp[];
        };
    }> {
        return this.makeRequest(options, '/IPlayerService/GetOwnedGames/v0001/');
    }

    getAppList(): Promise<{
        applist: { apps: SteamApp[] };
    }> {
        return this.makeRequest({}, '/ISteamApps/GetAppList/v2/');
    }

    makeRequest(request: { steamid?: string }, path: string): Promise<any> {
        path +=
            '?' +
            qs.stringify({
                ...request,
                key: this.apiKey,
                format: 'json',
            });
        return new Promise((resolve, reject) => {
            http.get(
                {
                    host: 'api.steampowered.com',
                    port: 80,
                    path: path,
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

                        resolve(dataJson);
                    });
                }
            ).on('error', reject);
        });
    }
}
