/// <reference types="node" />
import { EventEmitter } from "events";
import { Room } from "../../src/Room";
import { SeatReservation } from "../../src/MatchMaker";
import { LocalDriver } from "../../src/matchmaker/drivers/LocalDriver";
import { MongooseDriver } from "../../src/matchmaker/drivers/MongooseDriver";
import { Presence, Client, Deferred } from "../../src";
import { ClientState } from "../../src/transport/Transport";
export declare const DRIVERS: (LocalDriver | MongooseDriver)[];
export declare const PRESENCE_IMPLEMENTATIONS: Presence[];
export declare class RawClient extends EventEmitter {
    readyState: number;
}
export declare class WebSocketClient implements Client {
    id: string;
    sessionId: string;
    ref: RawClient;
    state: ClientState;
    messages: any[];
    _enqueuedMessages: any[];
    errors: any[];
    constructor(id?: string);
    send(message: any): void;
    receive(message: any): void;
    getMessageAt(index: number): any;
    raw(message: any, options: any): void;
    enqueueRaw(message: any, options: any): void;
    error(code: any, message: any): void;
    get lastMessage(): any;
    get readyState(): number;
    leave(code?: number): void;
    close(code?: number): void;
    terminate(): void;
}
export declare function createEmptyClient(): WebSocketClient;
export declare function createDummyClient(seatReservation: SeatReservation, options?: any): WebSocketClient;
export declare function timeout(ms?: number): Promise<unknown>;
export declare class DummyRoom extends Room {
    onCreate(): void;
    onDispose(): void;
    onJoin(): void;
    onLeave(): void;
}
export declare class Room2Clients extends Room {
    maxClients: number;
    onCreate(): void;
    onDispose(): void;
    onJoin(): void;
    onLeave(): void;
}
export declare class Room2ClientsExplicitLock extends Room {
    maxClients: number;
    onCreate(): void;
    onDispose(): void;
    onJoin(): void;
    onLeave(): void;
}
export declare class Room3Clients extends Room {
    maxClients: number;
    onCreate(): void;
    onDispose(): void;
    onJoin(): void;
    onLeave(): void;
}
export declare class ReconnectRoom extends Room {
    maxClients: number;
    onCreate(): void;
    onDispose(): void;
    onJoin(): void;
    onLeave(client: any, consented: any): Promise<void>;
}
export declare class ReconnectTokenRoom extends Room {
    maxClients: number;
    token: Deferred;
    onCreate(): void;
    onDispose(): void;
    onJoin(client: any): void;
    onLeave(client: any, consented: any): Promise<void>;
    onMessage(client: any, message: any): void;
}
export declare class RoomWithAsync extends DummyRoom {
    static ASYNC_TIMEOUT: number;
    maxClients: number;
    onAuth(): Promise<boolean>;
    onJoin(): void;
    onLeave(): Promise<void>;
    onDispose(): Promise<void>;
}
