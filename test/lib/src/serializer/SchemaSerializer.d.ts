import { Client } from '..';
import { Serializer } from './Serializer';
import { Definition, Schema } from '@colyseus/schema';
export declare class SchemaSerializer<T> implements Serializer<T> {
    id: string;
    private state;
    private hasFiltersByClient;
    private handshakeCache;
    reset(newState: T & Schema): void;
    getFullState(client?: Client): number[];
    applyPatches(clients: Client[]): boolean;
    handshake(): number[];
    hasFilter(schema: Definition, filters?: any, schemasCache?: WeakSet<Definition>): any;
}
