/// <reference types="node" />
import http, { IncomingMessage, ServerResponse } from 'http';
import WebSocket from 'ws';
import { ServerOptions as IServerOptions } from 'ws';
import * as matchMaker from './MatchMaker';
import { RegisteredHandler } from './matchmaker/RegisteredHandler';
import { Presence } from './presence/Presence';
import { Room } from './Room';
import { Type } from './types';
import { Transport } from './transport/Transport';
export declare type ServerOptions = IServerOptions & {
    pingInterval?: number;
    pingMaxRetries?: number;
    /**
     * @deprecated use `pingInterval` instead
     */
    pingTimeout?: number;
    /**
     * @deprecated use `pingMaxRetries` instead
     */
    pingCountMax?: number;
    /**
     * @deprecated remove on version 0.12.x
     */
    express?: any;
    verifyClient?: WebSocket.VerifyClientCallbackAsync;
    presence?: Presence;
    driver?: matchMaker.MatchMakerDriver;
    engine?: any;
    ws?: any;
    gracefullyShutdown?: boolean;
};
export declare class Server {
    transport: Transport;
    protected presence: Presence;
    protected processId: string;
    protected route: string;
    private exposedMethods;
    private allowedRoomNameChars;
    constructor(options?: ServerOptions);
    attach(options: ServerOptions): void;
    listen(port: number, hostname?: string, backlog?: number, listeningListener?: Function): Promise<unknown>;
    registerProcessForDiscovery(): void;
    define<T extends Type<Room>>(name: string, handler: T, defaultOptions?: Parameters<NonNullable<InstanceType<T>['onCreate']>>[0]): RegisteredHandler;
    gracefullyShutdown(exit?: boolean, err?: Error): Promise<void>;
    onShutdown(callback: () => void | Promise<any>): void;
    protected onShutdownCallback: () => void | Promise<any>;
    protected attachMatchMakingRoutes(server: http.Server): void;
    protected handleMatchMakeRequest(req: IncomingMessage, res: ServerResponse): Promise<void>;
}
