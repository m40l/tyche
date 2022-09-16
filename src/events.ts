import { Subject } from 'rxjs';
import { Event } from '../types/events';

const eventBus = new Subject<Event>();

export default eventBus;
