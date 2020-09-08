import WebSocket from 'ws';
import { Client, ClientState, ISendOptions } from '../Transport';
export declare class WebSocketClient implements Client {
    id: string;
    ref: WebSocket;
    sessionId: string;
    state: ClientState;
    _enqueuedMessages: any[];
    constructor(id: string, ref: WebSocket);
    send(messageOrType: any, messageOrOptions?: any | ISendOptions, options?: ISendOptions): void;
    enqueueRaw(data: ArrayLike<number>, options?: ISendOptions): void;
    raw(data: ArrayLike<number>, options?: ISendOptions): void;
    error(code: number, message?: string): void;
    get readyState(): number;
    leave(code?: number, data?: string): void;
    close(code?: number, data?: string): void;
    toJSON(): {
        sessionId: string;
        readyState: number;
    };
}
