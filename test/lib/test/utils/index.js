"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomWithAsync = exports.ReconnectTokenRoom = exports.ReconnectRoom = exports.Room3Clients = exports.Room2ClientsExplicitLock = exports.Room2Clients = exports.DummyRoom = exports.timeout = exports.createDummyClient = exports.createEmptyClient = exports.WebSocketClient = exports.RawClient = exports.PRESENCE_IMPLEMENTATIONS = exports.DRIVERS = void 0;
const notepack_io_1 = __importDefault(require("notepack.io"));
const ws_1 = __importDefault(require("ws"));
const events_1 = require("events");
const Room_1 = require("../../src/Room");
const LocalDriver_1 = require("../../src/matchmaker/drivers/LocalDriver");
const MongooseDriver_1 = require("../../src/matchmaker/drivers/MongooseDriver");
const src_1 = require("../../src");
const Transport_1 = require("../../src/transport/Transport");
// export const DRIVERS = [ new LocalDriver(), ];
// export const PRESENCE_IMPLEMENTATIONS: Presence[] = [ new LocalPresence(), ];
exports.DRIVERS = [
    new LocalDriver_1.LocalDriver(),
    new MongooseDriver_1.MongooseDriver('mongodb://127.0.0.1:27017/colyseus_test'),
];
exports.PRESENCE_IMPLEMENTATIONS = [
    new src_1.LocalPresence(),
    new src_1.RedisPresence()
];
class RawClient extends events_1.EventEmitter {
}
exports.RawClient = RawClient;
class WebSocketClient {
    constructor(id) {
        this.state = Transport_1.ClientState.JOINING;
        this.messages = [];
        this._enqueuedMessages = [];
        this.errors = [];
        this.id = id || null;
        this.sessionId = id || null;
        this.ref = new RawClient();
        this.ref.once('close', () => this.ref.readyState = ws_1.default.CLOSED);
    }
    send(message) {
        this.messages.push(message);
    }
    receive(message) {
        this.ref.emit('message', notepack_io_1.default.encode(message));
    }
    getMessageAt(index) {
        return notepack_io_1.default.decode(this.messages[index]);
    }
    raw(message, options) {
        this.messages.push(message);
    }
    enqueueRaw(message, options) {
        if (this.state === Transport_1.ClientState.JOINING) {
            this._enqueuedMessages.push(message);
            return;
        }
        this.messages.push(message);
    }
    error(code, message) {
        this.errors.push([code, message]);
    }
    get lastMessage() {
        return this.getMessageAt(this.messages.length - 1);
    }
    get readyState() {
        return this.ref.readyState;
    }
    leave(code) {
        this.ref.readyState = ws_1.default.CLOSED;
        this.ref.emit('close');
    }
    close(code) {
        this.leave(code);
    }
    terminate() {
        this.ref.emit('close');
    }
}
exports.WebSocketClient = WebSocketClient;
function createEmptyClient() {
    return new WebSocketClient();
}
exports.createEmptyClient = createEmptyClient;
function createDummyClient(seatReservation, options = {}) {
    let client = new WebSocketClient(seatReservation.sessionId);
    client.options = options;
    return client;
}
exports.createDummyClient = createDummyClient;
function timeout(ms = 200) {
    return new Promise((resolve, reject) => setTimeout(resolve, ms));
}
exports.timeout = timeout;
class DummyRoom extends Room_1.Room {
    onCreate() {
        this.onMessage("*", (_, type, message) => {
            this.broadcast(type, message);
        });
    }
    onDispose() { }
    onJoin() { }
    onLeave() { }
}
exports.DummyRoom = DummyRoom;
class Room2Clients extends Room_1.Room {
    constructor() {
        super(...arguments);
        this.maxClients = 2;
    }
    onCreate() {
        this.onMessage("*", (_, type, message) => {
            this.broadcast(type, message);
        });
    }
    onDispose() { }
    onJoin() { }
    onLeave() { }
}
exports.Room2Clients = Room2Clients;
class Room2ClientsExplicitLock extends Room_1.Room {
    constructor() {
        super(...arguments);
        this.maxClients = 2;
    }
    onCreate() {
        this.onMessage("lock", () => this.lock());
    }
    onDispose() { }
    onJoin() { }
    onLeave() { }
}
exports.Room2ClientsExplicitLock = Room2ClientsExplicitLock;
class Room3Clients extends Room_1.Room {
    constructor() {
        super(...arguments);
        this.maxClients = 3;
    }
    onCreate() {
        this.onMessage("*", (_, type, message) => {
            this.broadcast(type, message);
        });
    }
    onDispose() { }
    onJoin() { }
    onLeave() { }
}
exports.Room3Clients = Room3Clients;
class ReconnectRoom extends Room_1.Room {
    constructor() {
        super(...arguments);
        this.maxClients = 4;
    }
    onCreate() {
        this.onMessage("*", (_, type, message) => {
            this.broadcast(type, message);
        });
    }
    onDispose() { }
    onJoin() { }
    onLeave(client, consented) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (consented)
                    throw new Error("consented");
                yield this.allowReconnection(client, 0.2); // 200ms
            }
            catch (e) {
                // console.log("allowReconnection, error =>", e.message);
            }
        });
    }
}
exports.ReconnectRoom = ReconnectRoom;
class ReconnectTokenRoom extends Room_1.Room {
    constructor() {
        super(...arguments);
        this.maxClients = 4;
    }
    onCreate() {
        this.setState({});
    }
    onDispose() { }
    onJoin(client) {
        this.state[client.sessionId] = "CONNECTED";
    }
    onLeave(client, consented) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!consented) {
                const reconnection = this.allowReconnection(client);
                this.token = reconnection;
                try {
                    yield reconnection;
                }
                catch (e) {
                }
            }
        });
    }
    onMessage(client, message) { }
}
exports.ReconnectTokenRoom = ReconnectTokenRoom;
class RoomWithAsync extends DummyRoom {
    constructor() {
        super(...arguments);
        this.maxClients = 1;
    }
    onAuth() {
        return __awaiter(this, void 0, void 0, function* () {
            yield timeout(RoomWithAsync.ASYNC_TIMEOUT);
            return true;
        });
    }
    onJoin() { }
    onLeave() {
        return __awaiter(this, void 0, void 0, function* () {
            yield timeout(RoomWithAsync.ASYNC_TIMEOUT);
        });
    }
    onDispose() {
        return __awaiter(this, void 0, void 0, function* () {
            yield timeout(RoomWithAsync.ASYNC_TIMEOUT);
        });
    }
}
exports.RoomWithAsync = RoomWithAsync;
RoomWithAsync.ASYNC_TIMEOUT = 200;
