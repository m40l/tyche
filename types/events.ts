import { SessionGame } from './models';

export interface Event {
    event: string;
    model: string;
    id: string;
    data: any;
}

export abstract class SessionEvent implements Event {
    model = 'Session';
    constructor(public event: string, public id: string, public data: any) {}
}

export class ChooseGameEvent implements SessionEvent {
    event = 'ChooseGameEvent';
    model = 'Session';
    constructor(public id: string, public data: SessionGame) {}
}
