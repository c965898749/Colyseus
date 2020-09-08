"use strict";
/* tslint:disable:no-string-literal */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaSerializer = void 0;
const schema_1 = require("@colyseus/schema");
const Debug_1 = require("../Debug");
const Protocol_1 = require("../Protocol");
class SchemaSerializer {
    constructor() {
        this.id = 'schema';
        this.hasFiltersByClient = false;
    }
    reset(newState) {
        this.state = newState;
        this.hasFiltersByClient = this.hasFilter(newState['_schema'] || {}, newState['_filters'] || {});
    }
    getFullState(client) {
        return (client && this.hasFiltersByClient)
            ? this.state.encodeAllFiltered(client)
            : this.state.encodeAll();
    }
    applyPatches(clients) {
        const hasChanges = this.state.$changed;
        if (hasChanges) {
            let numClients = clients.length;
            // dump changes for patch debugging
            if (Debug_1.debugPatch.enabled) {
                Debug_1.debugPatch.dumpChanges = schema_1.dumpChanges(this.state);
            }
            if (!this.hasFiltersByClient) {
                // encode changes once, for all clients
                const patches = this.state.encode();
                patches.unshift(Protocol_1.Protocol.ROOM_STATE_PATCH);
                while (numClients--) {
                    const client = clients[numClients];
                    client.enqueueRaw(patches);
                }
                if (Debug_1.debugPatch.enabled) {
                    Debug_1.debugPatch('%d bytes sent to %d clients, %j', patches.length, clients.length, Debug_1.debugPatch.dumpChanges);
                }
            }
            else {
                // encode state multiple times, for each client
                while (numClients--) {
                    const client = clients[numClients];
                    client.enqueueRaw([Protocol_1.Protocol.ROOM_STATE_PATCH, ...this.state.encodeFiltered(client)]);
                }
                if (Debug_1.debugPatch.enabled) {
                    Debug_1.debugPatch('filterd patch sent to %d clients, %j', clients.length, Debug_1.debugPatch.dumpChanges);
                }
                this.state.discardAllChanges();
            }
        }
        return hasChanges;
    }
    handshake() {
        /**
         * Cache handshake to avoid encoding it for each client joining
         */
        if (!this.handshakeCache) {
            this.handshakeCache = (this.state && schema_1.Reflection.encode(this.state));
        }
        return this.handshakeCache;
    }
    hasFilter(schema, filters = {}, schemasCache) {
        let hasFilter = false;
        // set of schemas we already checked OR are still checking
        const knownSchemas = schemasCache || new WeakSet();
        knownSchemas.add(schema);
        for (const fieldName of Object.keys(schema)) {
            // skip if a filter has been found
            if (hasFilter) {
                break;
            }
            if (filters[fieldName]) {
                hasFilter = true;
            }
            else if (typeof schema[fieldName] === 'function') {
                const childSchema = schema[fieldName]['_schema'];
                const childFilters = schema[fieldName]['_filters'];
                if (!knownSchemas.has(childSchema)) {
                    hasFilter = this.hasFilter(childSchema, childFilters, knownSchemas);
                }
            }
            else if (Array.isArray(schema[fieldName])) {
                if (typeof schema[fieldName][0] === 'string') {
                    continue;
                }
                const childSchema = schema[fieldName][0]['_schema'];
                const childFilters = schema[fieldName][0]['_filters'];
                if (!knownSchemas.has(childSchema)) {
                    hasFilter = this.hasFilter(childSchema, childFilters, knownSchemas);
                }
            }
            else if (schema[fieldName].map) {
                if (typeof schema[fieldName].map === 'string') {
                    continue;
                }
                const childSchema = schema[fieldName].map['_schema'];
                const childFilters = schema[fieldName].map['_filters'];
                if (!knownSchemas.has(childSchema)) {
                    hasFilter = this.hasFilter(childSchema, childFilters, knownSchemas);
                }
            }
        }
        return hasFilter;
    }
}
exports.SchemaSerializer = SchemaSerializer;
