"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const assert_1 = __importDefault(require("assert"));
const sinon_1 = __importDefault(require("sinon"));
const Colyseus = __importStar(require("colyseus.js"));
const schema_1 = require("@colyseus/schema");
const src_1 = require("../src");
const utils_1 = require("./utils");
const ServerError_1 = require("../src/errors/ServerError");
const ws_1 = __importDefault(require("ws"));
const TEST_PORT = 8567;
const TEST_ENDPOINT = `ws://localhost:${TEST_PORT}`;
describe("Integration", () => {
    for (let i = 0; i < utils_1.PRESENCE_IMPLEMENTATIONS.length; i++) {
        const presence = utils_1.PRESENCE_IMPLEMENTATIONS[i];
        for (let j = 0; j < utils_1.DRIVERS.length; j++) {
            const driver = utils_1.DRIVERS[j];
            describe(`Driver => ${driver.constructor.name}, Presence => ${presence.constructor.name}`, () => {
                const server = new src_1.Server({
                    pingInterval: 150,
                    pingMaxRetries: 1,
                    presence,
                    driver
                });
                const client = new Colyseus.Client(TEST_ENDPOINT);
                before(() => __awaiter(void 0, void 0, void 0, function* () {
                    // setup matchmaker
                    src_1.matchMaker.setup(presence, driver, 'dummyProcessId');
                    // define a room
                    server.define("dummy", utils_1.DummyRoom);
                    server.define("room3", utils_1.Room3Clients);
                    // listen for testing
                    yield server.listen(TEST_PORT);
                }));
                after(() => server.gracefullyShutdown(false));
                describe("Room lifecycle", () => {
                    describe("onCreate()", () => {
                        it("sync onCreate()", () => __awaiter(void 0, void 0, void 0, function* () {
                            let onCreateCalled = false;
                            src_1.matchMaker.defineRoomType('oncreate', class _ extends src_1.Room {
                                onCreate(options) {
                                    assert_1.default.deepEqual({ string: "hello", number: 1 }, options);
                                    onCreateCalled = true;
                                }
                            });
                            const connection = yield client.joinOrCreate('oncreate', { string: "hello", number: 1 });
                            assert_1.default.ok(onCreateCalled);
                            // assert 'presence' implementation
                            const room = src_1.matchMaker.getRoomById(connection.id);
                            assert_1.default.equal(presence, room.presence);
                            yield connection.leave();
                        }));
                        it("async onCreate()", () => __awaiter(void 0, void 0, void 0, function* () {
                            let onCreateCalled = false;
                            src_1.matchMaker.defineRoomType('oncreate', class _ extends src_1.Room {
                                onCreate(options) {
                                    return __awaiter(this, void 0, void 0, function* () {
                                        return new Promise(resolve => setTimeout(() => {
                                            onCreateCalled = true;
                                            resolve();
                                        }, 100));
                                    });
                                }
                            });
                            const connection = yield client.joinOrCreate('oncreate', { string: "hello", number: 1 });
                            assert_1.default.ok(onCreateCalled);
                            yield connection.leave();
                        }));
                    });
                    describe("onJoin()", () => {
                        it("sync onJoin()", () => __awaiter(void 0, void 0, void 0, function* () {
                            let onJoinCalled = false;
                            src_1.matchMaker.defineRoomType('onjoin', class _ extends src_1.Room {
                                onJoin(client, options) {
                                    onJoinCalled = true;
                                    assert_1.default.deepEqual({ string: "hello", number: 1 }, options);
                                }
                            });
                            const connection = yield client.joinOrCreate('onjoin', { string: "hello", number: 1 });
                            assert_1.default.ok(onJoinCalled);
                            yield connection.leave();
                        }));
                        it("async onJoin support", () => __awaiter(void 0, void 0, void 0, function* () {
                            let onJoinCalled = false;
                            src_1.matchMaker.defineRoomType('onjoin', class _ extends src_1.Room {
                                onJoin(client, options) {
                                    return __awaiter(this, void 0, void 0, function* () {
                                        return new Promise(resolve => setTimeout(() => {
                                            onJoinCalled = true;
                                            resolve();
                                        }, 20));
                                    });
                                }
                            });
                            const connection = yield client.joinOrCreate('onjoin');
                            yield utils_1.timeout(50);
                            assert_1.default.ok(onJoinCalled);
                            yield connection.leave();
                        }));
                        it("error during onJoin should reject client-side promise", () => __awaiter(void 0, void 0, void 0, function* () {
                            src_1.matchMaker.defineRoomType('onjoin', class _ extends src_1.Room {
                                onJoin(client, options) {
                                    return __awaiter(this, void 0, void 0, function* () {
                                        throw new Error("not_allowed");
                                    });
                                }
                            });
                            yield assert_1.default.rejects(() => __awaiter(void 0, void 0, void 0, function* () { return yield client.joinOrCreate('onjoin'); }));
                        }));
                        it("should discard connections when early disconnected", () => __awaiter(void 0, void 0, void 0, function* () {
                            src_1.matchMaker.defineRoomType('onjoin', class _ extends src_1.Room {
                                onJoin(client, options) {
                                    return __awaiter(this, void 0, void 0, function* () {
                                        return new Promise((resolve) => setTimeout(resolve, 100));
                                    });
                                }
                            });
                            // keep one active connection to prevent room's disposal
                            const activeConnection = yield client.joinOrCreate("onjoin");
                            const seatReservation = yield src_1.matchMaker.joinOrCreate('onjoin', {});
                            const room = src_1.matchMaker.getRoomById(seatReservation.room.roomId);
                            const lostConnection = new ws_1.default(`${TEST_ENDPOINT}/${seatReservation.room.processId}/${seatReservation.room.roomId}?sessionId=${seatReservation.sessionId}`);
                            // close connection immediatelly after connecting.
                            lostConnection.on("open", () => lostConnection.close());
                            yield utils_1.timeout(110);
                            const rooms = yield src_1.matchMaker.query({ name: "onjoin" });
                            assert_1.default.equal(1, room.clients.length);
                            assert_1.default.equal(1, rooms[0].clients);
                            yield activeConnection.leave();
                            yield utils_1.timeout(50);
                        }));
                    });
                    it("onAuth() error should reject join promise", () => __awaiter(void 0, void 0, void 0, function* () {
                        src_1.matchMaker.defineRoomType('onauth', class _ extends src_1.Room {
                            onAuth(client, options) {
                                return __awaiter(this, void 0, void 0, function* () {
                                    throw new Error("not_allowed");
                                });
                            }
                        });
                        yield assert_1.default.rejects(() => __awaiter(void 0, void 0, void 0, function* () { return yield client.joinOrCreate('onauth'); }));
                    }));
                    it("onLeave()", () => __awaiter(void 0, void 0, void 0, function* () {
                        let onLeaveCalled = false;
                        src_1.matchMaker.defineRoomType('onleave', class _ extends src_1.Room {
                            onLeave(client, options) {
                                onLeaveCalled = true;
                            }
                        });
                        const connection = yield client.joinOrCreate('onleave');
                        yield connection.leave();
                        yield utils_1.timeout(50);
                        assert_1.default.ok(onLeaveCalled);
                    }));
                    it("async onLeave()", () => __awaiter(void 0, void 0, void 0, function* () {
                        let onLeaveCalled = false;
                        src_1.matchMaker.defineRoomType('onleave', class _ extends src_1.Room {
                            onLeave(client, options) {
                                return __awaiter(this, void 0, void 0, function* () {
                                    return new Promise(resolve => setTimeout(() => {
                                        onLeaveCalled = true;
                                        resolve();
                                    }, 100));
                                });
                            }
                        });
                        const connection = yield client.joinOrCreate('onleave');
                        yield connection.leave();
                        yield utils_1.timeout(150);
                        assert_1.default.ok(onLeaveCalled);
                    }));
                    it("onDispose()", () => __awaiter(void 0, void 0, void 0, function* () {
                        let onDisposeCalled = false;
                        src_1.matchMaker.defineRoomType('onleave', class _ extends src_1.Room {
                            onDispose() {
                                onDisposeCalled = true;
                            }
                        });
                        const connection = yield client.joinOrCreate('onleave');
                        yield connection.leave();
                        yield utils_1.timeout(50);
                        assert_1.default.ok(!src_1.matchMaker.getRoomById(connection.id));
                        assert_1.default.ok(onDisposeCalled);
                    }));
                    it("async onDispose()", () => __awaiter(void 0, void 0, void 0, function* () {
                        let onDisposeCalled = false;
                        src_1.matchMaker.defineRoomType('onleave', class _ extends src_1.Room {
                            onDispose() {
                                return __awaiter(this, void 0, void 0, function* () {
                                    return new Promise(resolve => setTimeout(() => {
                                        onDisposeCalled = true;
                                        resolve();
                                    }, 100));
                                });
                            }
                        });
                        const connection = yield client.joinOrCreate('onleave');
                        yield connection.leave();
                        yield utils_1.timeout(150);
                        assert_1.default.ok(!src_1.matchMaker.getRoomById(connection.id));
                        assert_1.default.ok(onDisposeCalled);
                    }));
                    describe("onMessage()", () => {
                        it("should support string key as message type", () => __awaiter(void 0, void 0, void 0, function* () {
                            const messageToSend = {
                                string: "hello",
                                number: 10,
                                float: Math.PI,
                                array: [1, 2, 3, 4, 5],
                                nested: {
                                    string: "hello",
                                    number: 10,
                                    float: Math.PI,
                                }
                            };
                            let onMessageCalled = false;
                            let sessionId;
                            src_1.matchMaker.defineRoomType('onmessage', class _ extends src_1.Room {
                                onCreate() {
                                    this.onMessage("msgtype", (client, message) => {
                                        sessionId = client.sessionId;
                                        assert_1.default.deepEqual(messageToSend, message);
                                        onMessageCalled = true;
                                    });
                                }
                            });
                            const connection = yield client.joinOrCreate('onmessage');
                            connection.send("msgtype", messageToSend);
                            yield utils_1.timeout(20);
                            yield connection.leave();
                            assert_1.default.equal(sessionId, connection.sessionId);
                            assert_1.default.ok(onMessageCalled);
                        }));
                        it("should support number key as message type", () => __awaiter(void 0, void 0, void 0, function* () {
                            let MessageTypes;
                            (function (MessageTypes) {
                                MessageTypes[MessageTypes["REQUEST"] = 0] = "REQUEST";
                                MessageTypes[MessageTypes["RESPONSE"] = 1] = "RESPONSE";
                            })(MessageTypes || (MessageTypes = {}));
                            const messageToSend = {
                                string: "hello",
                                number: 10,
                                float: Math.PI,
                                array: [1, 2, 3, 4, 5],
                                nested: {
                                    string: "hello",
                                    number: 10,
                                    float: Math.PI,
                                }
                            };
                            let onMessageCalled = false;
                            let onMessageReceived = false;
                            let sessionId;
                            src_1.matchMaker.defineRoomType('onmessage', class _ extends src_1.Room {
                                onCreate() {
                                    this.onMessage(MessageTypes.REQUEST, (client, message) => {
                                        sessionId = client.sessionId;
                                        client.send(MessageTypes.RESPONSE, message);
                                        assert_1.default.deepEqual(messageToSend, message);
                                        onMessageCalled = true;
                                    });
                                }
                            });
                            const connection = yield client.joinOrCreate('onmessage');
                            connection.send(MessageTypes.REQUEST, messageToSend);
                            connection.onMessage(MessageTypes.RESPONSE, (message) => {
                                assert_1.default.deepEqual(messageToSend, message);
                                onMessageReceived = true;
                            });
                            yield utils_1.timeout(20);
                            yield connection.leave();
                            assert_1.default.equal(sessionId, connection.sessionId);
                            assert_1.default.ok(onMessageCalled);
                            assert_1.default.ok(onMessageReceived);
                        }));
                        it("should support send/receive messages by type without payload.", () => __awaiter(void 0, void 0, void 0, function* () {
                            let onMessageCalled = false;
                            let onMessageReceived = false;
                            let sessionId;
                            src_1.matchMaker.defineRoomType('onmessage', class _ extends src_1.Room {
                                onCreate() {
                                    this.onMessage(1, (client) => {
                                        sessionId = client.sessionId;
                                        onMessageCalled = true;
                                        client.send("response");
                                    });
                                }
                            });
                            const connection = yield client.joinOrCreate('onmessage');
                            connection.send(1);
                            connection.onMessage("response", (message) => {
                                assert_1.default.ok(message === undefined);
                                onMessageReceived = true;
                            });
                            yield utils_1.timeout(20);
                            yield connection.leave();
                            assert_1.default.equal(sessionId, connection.sessionId);
                            assert_1.default.ok(onMessageCalled);
                            assert_1.default.ok(onMessageReceived);
                        }));
                    });
                    describe("setPatchRate()", () => {
                        class PatchState extends schema_1.Schema {
                            constructor() {
                                super(...arguments);
                                this.number = 0;
                            }
                        }
                        __decorate([
                            schema_1.type("number")
                        ], PatchState.prototype, "number", void 0);
                        it("should receive patch at every patch rate", () => __awaiter(void 0, void 0, void 0, function* () {
                            src_1.matchMaker.defineRoomType('patchinterval', class _ extends src_1.Room {
                                onCreate(options) {
                                    this.setState(new PatchState());
                                    this.setPatchRate(20);
                                    this.setSimulationInterval(() => this.state.number++);
                                }
                            });
                            const connection = yield client.create('patchinterval');
                            let patchesReceived = 0;
                            connection.onStateChange(() => patchesReceived++);
                            yield utils_1.timeout(20 * 25);
                            assert_1.default.ok(patchesReceived > 20, "should have received > 20 patches");
                            assert_1.default.ok(connection.state.number >= 20);
                            connection.leave();
                            yield utils_1.timeout(50);
                        }));
                        it("should not receive any patch if patchRate is nullified", () => __awaiter(void 0, void 0, void 0, function* () {
                            src_1.matchMaker.defineRoomType('patchinterval', class _ extends src_1.Room {
                                onCreate(options) {
                                    this.setState(new PatchState());
                                    this.setPatchRate(null);
                                    this.setSimulationInterval(() => this.state.number++);
                                }
                            });
                            const connection = yield client.create('patchinterval');
                            let stateChangeCount = 0;
                            connection.onStateChange(() => stateChangeCount++);
                            yield utils_1.timeout(500);
                            // simulation interval may have run a short amount of cycles for the first ROOM_STATE message
                            assert_1.default.equal(1, stateChangeCount);
                            connection.leave();
                            yield utils_1.timeout(50);
                        }));
                    });
                    describe("broadcast()", () => {
                        it("all clients should receive broadcast data", () => __awaiter(void 0, void 0, void 0, function* () {
                            src_1.matchMaker.defineRoomType('broadcast', class _ extends src_1.Room {
                                constructor() {
                                    super(...arguments);
                                    this.maxClients = 3;
                                }
                                onCreate() {
                                    this.onMessage("*", (_, type, message) => {
                                        this.broadcast(type, message);
                                    });
                                }
                            });
                            const messages = [];
                            const conn1 = yield client.joinOrCreate('broadcast');
                            conn1.onMessage("num", message => messages.push(message));
                            const conn2 = yield client.joinOrCreate('broadcast');
                            conn2.onMessage("num", message => messages.push(message));
                            const conn3 = yield client.joinOrCreate('broadcast');
                            conn3.onMessage("num", message => messages.push(message));
                            conn1.send("num", "one");
                            conn2.send("num", "two");
                            conn3.send("num", "three");
                            yield utils_1.timeout(200);
                            assert_1.default.deepEqual(["one", "one", "one", "three", "three", "three", "two", "two", "two"], messages.sort());
                            conn1.leave();
                            conn2.leave();
                            conn3.leave();
                            yield utils_1.timeout(50);
                        }));
                        it("should broadcast except to specific client", () => __awaiter(void 0, void 0, void 0, function* () {
                            src_1.matchMaker.defineRoomType('broadcast', class _ extends src_1.Room {
                                constructor() {
                                    super(...arguments);
                                    this.maxClients = 3;
                                }
                                onCreate() {
                                    this.onMessage("*", (client, type, message) => {
                                        this.broadcast(type, message, { except: client });
                                    });
                                }
                            });
                            const messages = [];
                            const conn1 = yield client.joinOrCreate('broadcast');
                            conn1.onMessage("num", message => messages.push(message));
                            const conn2 = yield client.joinOrCreate('broadcast');
                            conn2.onMessage("num", message => messages.push(message));
                            const conn3 = yield client.joinOrCreate('broadcast');
                            conn3.onMessage("num", message => messages.push(message));
                            conn1.send("num", "one");
                            conn2.send("num", "two");
                            conn3.send("num", "three");
                            yield utils_1.timeout(200);
                            assert_1.default.deepEqual(["one", "one", "three", "three", "two", "two"], messages.sort());
                            conn1.leave();
                            conn2.leave();
                            conn3.leave();
                            yield utils_1.timeout(50);
                        }));
                        it("should allow to send/broadcast during onJoin() for current client", () => __awaiter(void 0, void 0, void 0, function* () {
                            src_1.matchMaker.defineRoomType('broadcast', class _ extends src_1.Room {
                                onJoin(client, options) {
                                    client.send("send", "hello");
                                    this.broadcast("broadcast", "hello");
                                }
                            });
                            const conn = yield client.joinOrCreate('broadcast');
                            let onMessageCalled = false;
                            let broadcastedMessage;
                            let sentMessage;
                            conn.onMessage("broadcast", (_message) => {
                                onMessageCalled = true;
                                broadcastedMessage = _message;
                            });
                            conn.onMessage("send", (_message) => {
                                onMessageCalled = true;
                                sentMessage = _message;
                            });
                            yield utils_1.timeout(300);
                            assert_1.default.equal(true, onMessageCalled);
                            assert_1.default.equal("hello", broadcastedMessage);
                            assert_1.default.equal("hello", sentMessage);
                            conn.leave();
                        }));
                        it("should broadcast after patch", () => __awaiter(void 0, void 0, void 0, function* () {
                            class DummyState extends schema_1.Schema {
                                constructor() {
                                    super(...arguments);
                                    this.number = 0;
                                }
                            }
                            __decorate([
                                schema_1.type("number")
                            ], DummyState.prototype, "number", void 0);
                            src_1.matchMaker.defineRoomType('broadcast_afterpatch', class _ extends src_1.Room {
                                onCreate() {
                                    this.setPatchRate(100);
                                    this.setState(new DummyState);
                                }
                                onJoin(client, options) {
                                    this.broadcast("startup", "hello", { afterNextPatch: true });
                                    this.state.number = 1;
                                }
                            });
                            const conn = yield client.joinOrCreate('broadcast_afterpatch');
                            let onMessageCalled = false;
                            let message;
                            conn.onMessage("startup", (_message) => {
                                onMessageCalled = true;
                                message = _message;
                            });
                            yield utils_1.timeout(50);
                            assert_1.default.equal(false, onMessageCalled);
                            yield utils_1.timeout(100);
                            assert_1.default.equal(true, onMessageCalled);
                            assert_1.default.equal("hello", message);
                            conn.leave();
                        }));
                    });
                    describe("send()", () => {
                        it("send() schema-encoded instances", () => __awaiter(void 0, void 0, void 0, function* () {
                            const ctx = new schema_1.Context();
                            class State extends schema_1.Schema {
                                constructor() {
                                    super(...arguments);
                                    this.num = 1;
                                }
                            }
                            __decorate([
                                schema_1.type("number", ctx)
                            ], State.prototype, "num", void 0);
                            class Message extends schema_1.Schema {
                                constructor() {
                                    super(...arguments);
                                    this.str = "Hello world";
                                }
                            }
                            __decorate([
                                schema_1.type("string", ctx)
                            ], Message.prototype, "str", void 0);
                            let onMessageCalled = false;
                            src_1.matchMaker.defineRoomType('sendschema', class _ extends src_1.Room {
                                onCreate() {
                                    this.setState(new State());
                                    this.onMessage("ping", (client, message) => {
                                        const msg = new Message();
                                        msg.str = message;
                                        client.send(msg);
                                    });
                                }
                            });
                            const connection = yield client.joinOrCreate('sendschema', {}, State);
                            let messageReceived;
                            connection.onMessage(Message, (message) => {
                                onMessageCalled = true;
                                messageReceived = message;
                            });
                            connection.send("ping", "hello!");
                            yield utils_1.timeout(100);
                            yield connection.leave();
                            assert_1.default.ok(onMessageCalled);
                            assert_1.default.equal(messageReceived.str, "hello!");
                        }));
                    });
                    describe("lock / unlock", () => {
                        before(() => {
                            server.define("room2", utils_1.Room2Clients);
                            server.define("room_explicit_lock", utils_1.Room2ClientsExplicitLock);
                        });
                        it("should lock room automatically when maxClients is reached", () => __awaiter(void 0, void 0, void 0, function* () {
                            const conn1 = yield client.joinOrCreate('room2');
                            const room = src_1.matchMaker.getRoomById(conn1.id);
                            assert_1.default.equal(false, room.locked);
                            const conn2 = yield client.joinOrCreate('room2');
                            assert_1.default.equal(2, room.clients.length);
                            assert_1.default.equal(true, room.locked);
                            const roomListing = (yield src_1.matchMaker.query({}))[0];
                            assert_1.default.equal(true, roomListing.locked);
                            conn1.leave();
                            conn2.leave();
                            yield utils_1.timeout(100);
                        }));
                        it("should unlock room automatically when last client leaves", () => __awaiter(void 0, void 0, void 0, function* () {
                            const conn1 = yield client.joinOrCreate('room2');
                            const conn2 = yield client.joinOrCreate('room2');
                            const room = src_1.matchMaker.getRoomById(conn1.id);
                            assert_1.default.equal(2, room.clients.length);
                            assert_1.default.equal(true, room.locked);
                            conn2.leave();
                            yield utils_1.timeout(50);
                            assert_1.default.equal(1, room.clients.length);
                            assert_1.default.equal(false, room.locked);
                            const roomListing = (yield src_1.matchMaker.query({ name: "room2" }))[0];
                            assert_1.default.equal(false, roomListing.locked);
                            conn1.leave();
                        }));
                        it("when explicitly locked, should remain locked when last client leaves", () => __awaiter(void 0, void 0, void 0, function* () {
                            const conn1 = yield client.joinOrCreate('room_explicit_lock');
                            const conn2 = yield client.joinOrCreate('room_explicit_lock');
                            const room = src_1.matchMaker.getRoomById(conn1.id);
                            assert_1.default.equal(2, room.clients.length);
                            assert_1.default.equal(true, room.locked);
                            conn1.send("lock"); // send explicit lock to handler
                            yield utils_1.timeout(50);
                            assert_1.default.equal(true, room.locked);
                            conn2.leave();
                            yield utils_1.timeout(50);
                            assert_1.default.equal(1, room.clients.length);
                            assert_1.default.equal(true, room.locked);
                            const roomListing = (yield src_1.matchMaker.query({}))[0];
                            assert_1.default.equal(true, roomListing.locked);
                            conn1.leave();
                        }));
                    });
                    describe("disconnect()", () => {
                        it("should disconnect all clients", () => __awaiter(void 0, void 0, void 0, function* () {
                            src_1.matchMaker.defineRoomType('disconnect', class _ extends src_1.Room {
                                constructor() {
                                    super(...arguments);
                                    this.maxClients = 2;
                                }
                                onCreate() {
                                    this.clock.setTimeout(() => this.disconnect(), 100);
                                }
                            });
                            let disconnected = 0;
                            const conn1 = yield client.joinOrCreate('disconnect');
                            conn1.onLeave(() => disconnected++);
                            const conn2 = yield client.joinOrCreate('disconnect');
                            conn2.onLeave(() => disconnected++);
                            assert_1.default.equal(conn1.id, conn2.id, "should've joined the same room");
                            yield utils_1.timeout(150);
                            assert_1.default.equal(2, disconnected, "both clients should've been disconnected");
                        }));
                    });
                    describe("Seat reservation", () => {
                        it("should not exceed maxClients", () => __awaiter(void 0, void 0, void 0, function* () {
                            // make sure "presence" entry doesn't exist before first client.
                            yield presence.hdel("created", "single3");
                            src_1.matchMaker.defineRoomType("single3", class _ extends src_1.Room {
                                constructor() {
                                    super(...arguments);
                                    this.maxClients = 3;
                                }
                                onCreate() {
                                    return __awaiter(this, void 0, void 0, function* () {
                                        const hasRoom = yield presence.hget("created", "single3");
                                        if (hasRoom) {
                                            throw new Error("only_one_room_of_this_type_allowed");
                                        }
                                        else {
                                            yield this.presence.hset("created", "single3", "1");
                                        }
                                    });
                                }
                            });
                            let connections = [];
                            const promises = [
                                client.joinOrCreate("single3").then(conn => connections.push(conn)),
                                client.joinOrCreate("single3").then(conn => connections.push(conn)),
                                client.joinOrCreate("single3").then(conn => connections.push(conn)),
                                client.joinOrCreate("single3").then(conn => connections.push(conn)),
                                client.joinOrCreate("single3").then(conn => connections.push(conn)),
                                client.joinOrCreate("single3").then(conn => connections.push(conn)),
                                client.joinOrCreate("single3").then(conn => connections.push(conn)),
                                client.joinOrCreate("single3").then(conn => connections.push(conn)),
                                client.joinOrCreate("single3").then(conn => connections.push(conn)),
                            ];
                            try {
                                yield Promise.all(promises);
                            }
                            catch (e) {
                                // console.log(e);
                            }
                            yield utils_1.timeout(1000);
                            const rooms = yield src_1.matchMaker.query({ name: "single3" });
                            const room = rooms[0];
                            assert_1.default.equal(3, connections.length);
                            assert_1.default.deepEqual([room.roomId, room.roomId, room.roomId], connections.map(conn => conn.id));
                            assert_1.default.equal(1, rooms.length);
                            assert_1.default.equal(room.roomId, rooms[0].roomId);
                        }));
                        it("consumeSeatReservation()", () => __awaiter(void 0, void 0, void 0, function* () {
                            const seatReservation = yield src_1.matchMaker.create("dummy", {});
                            const conn = yield client.consumeSeatReservation(seatReservation);
                            assert_1.default.equal(conn.id, seatReservation.room.roomId);
                            conn.leave();
                        }));
                    });
                    describe("`pingTimeout` / `pingMaxRetries`", () => {
                        it("should terminate unresponsive client after connection is ready", () => __awaiter(void 0, void 0, void 0, function* () {
                            const conn = yield client.joinOrCreate("dummy");
                            // force websocket client to be unresponsive
                            conn.connection.ws._socket.removeAllListeners();
                            assert_1.default.ok(src_1.matchMaker.getRoomById(conn.id));
                            yield utils_1.timeout(700);
                            assert_1.default.ok(!src_1.matchMaker.getRoomById(conn.id));
                        }));
                        it("should remove the room if seat reservation is never fulfiled", () => __awaiter(void 0, void 0, void 0, function* () {
                            const stub = sinon_1.default.stub(client, 'consumeSeatReservation').callsFake(function (response) {
                                return response;
                            });
                            const seatReservation = yield client.createMatchMakeRequest('joinOrCreate', "dummy", {});
                            yield client.createMatchMakeRequest('joinOrCreate', "dummy", {});
                            assert_1.default.ok(src_1.matchMaker.getRoomById(seatReservation.room.roomId));
                            yield utils_1.timeout(500);
                            assert_1.default.ok(!src_1.matchMaker.getRoomById(seatReservation.room.roomId));
                            stub.restore();
                        }));
                    });
                });
                describe("Error handling", () => {
                    it("ErrorCode.MATCHMAKE_NO_HANDLER", () => __awaiter(void 0, void 0, void 0, function* () {
                        try {
                            yield client.joinOrCreate('nonexisting');
                            assert_1.default.fail("joinOrCreate should have failed.");
                        }
                        catch (e) {
                            assert_1.default.equal(src_1.ErrorCode.MATCHMAKE_NO_HANDLER, e.code);
                        }
                    }));
                    it("should have reasonable error message when providing an empty room name", () => __awaiter(void 0, void 0, void 0, function* () {
                        try {
                            yield client.joinOrCreate('');
                            assert_1.default.fail("joinOrCreate should have failed.");
                        }
                        catch (e) {
                            assert_1.default.equal(src_1.ErrorCode.MATCHMAKE_NO_HANDLER, e.code);
                            assert_1.default.equal('provided room name "" not defined', e.message);
                        }
                    }));
                    it("ErrorCode.AUTH_FAILED", () => __awaiter(void 0, void 0, void 0, function* () {
                        src_1.matchMaker.defineRoomType('onAuthFail', class _ extends src_1.Room {
                            onAuth(client, options) {
                                return __awaiter(this, void 0, void 0, function* () {
                                    return false;
                                });
                            }
                        });
                        try {
                            yield client.joinOrCreate('onAuthFail');
                            assert_1.default.fail("joinOrCreate should have failed.");
                        }
                        catch (e) {
                            assert_1.default.equal(src_1.ErrorCode.AUTH_FAILED, e.code);
                        }
                    }));
                    it("onAuth: custom error", () => __awaiter(void 0, void 0, void 0, function* () {
                        src_1.matchMaker.defineRoomType('onAuthFail', class _ extends src_1.Room {
                            onAuth(client, options) {
                                return __awaiter(this, void 0, void 0, function* () {
                                    throw new ServerError_1.ServerError(1, "invalid token");
                                });
                            }
                        });
                        try {
                            yield client.joinOrCreate('onAuthFail');
                            assert_1.default.fail("joinOrCreate should have failed.");
                        }
                        catch (e) {
                            assert_1.default.equal(1, e.code);
                            assert_1.default.equal("invalid token", e.message);
                        }
                    }));
                    it("onJoin: application error", () => __awaiter(void 0, void 0, void 0, function* () {
                        src_1.matchMaker.defineRoomType('onJoinError', class _ extends src_1.Room {
                            onJoin(client, options) {
                                return __awaiter(this, void 0, void 0, function* () {
                                    throw new Error("unexpected error");
                                });
                            }
                        });
                        try {
                            yield client.joinOrCreate('onJoinError');
                            assert_1.default.fail("joinOrCreate should have failed.");
                        }
                        catch (e) {
                            assert_1.default.equal(src_1.ErrorCode.APPLICATION_ERROR, e.code);
                            assert_1.default.equal("unexpected error", e.message);
                        }
                    }));
                    it("onJoin: application error with custom code", () => __awaiter(void 0, void 0, void 0, function* () {
                        src_1.matchMaker.defineRoomType('onJoinError', class _ extends src_1.Room {
                            onJoin(client, options) {
                                return __awaiter(this, void 0, void 0, function* () {
                                    throw new ServerError_1.ServerError(2, "unexpected error");
                                });
                            }
                        });
                        try {
                            yield client.joinOrCreate('onJoinError');
                            assert_1.default.fail("joinOrCreate should have failed.");
                        }
                        catch (e) {
                            assert_1.default.equal(2, e.code);
                            assert_1.default.equal("unexpected error", e.message);
                        }
                    }));
                });
            });
        }
    }
});
