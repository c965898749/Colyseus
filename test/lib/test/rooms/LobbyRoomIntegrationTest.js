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
const Colyseus = __importStar(require("colyseus.js"));
const src_1 = require("../../src");
const utils_1 = require("./../utils");
const src_2 = require("../../src");
describe("LobbyRoom: Integration", () => {
    for (let i = 0; i < utils_1.PRESENCE_IMPLEMENTATIONS.length; i++) {
        const presence = utils_1.PRESENCE_IMPLEMENTATIONS[i];
        for (let j = 0; j < utils_1.DRIVERS.length; j++) {
            const driver = utils_1.DRIVERS[j];
            describe(`Driver => ${driver.constructor.name}, Presence => ${presence.constructor.name}`, () => {
                const TEST_PORT = 4000 + Math.floor((Math.random() * 1000));
                const TEST_ENDPOINT = `ws://localhost:${TEST_PORT}`;
                const server = new src_1.Server({
                    pingInterval: 150,
                    pingMaxRetries: 1,
                    presence,
                    driver
                });
                const client = new Colyseus.Client(TEST_ENDPOINT);
                before(() => __awaiter(void 0, void 0, void 0, function* () {
                    // listen for testing
                    yield server.listen(TEST_PORT);
                }));
                beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
                    // setup matchmaker
                    src_1.matchMaker.setup(presence, driver, 'dummyProcessId');
                    // define a room
                    src_1.matchMaker.defineRoomType("lobby", src_2.LobbyRoom);
                    src_1.matchMaker.defineRoomType("dummy_1", utils_1.DummyRoom).enableRealtimeListing();
                    src_1.matchMaker.defineRoomType("dummy_2", utils_1.DummyRoom).enableRealtimeListing();
                }));
                after(() => __awaiter(void 0, void 0, void 0, function* () { return yield server.gracefullyShutdown(false); }));
                afterEach(() => __awaiter(void 0, void 0, void 0, function* () { return yield src_1.matchMaker.gracefullyShutdown(); }));
                it("should receive full list of rooms when connecting.", () => __awaiter(void 0, void 0, void 0, function* () {
                    yield client.create('dummy_1');
                    yield client.create('dummy_2');
                    const lobby = yield client.joinOrCreate("lobby");
                    let onMessageCalled = false;
                    lobby.onMessage("rooms", (rooms) => {
                        onMessageCalled = true;
                        assert_1.default.equal(2, rooms.length);
                    });
                    lobby.onMessage("+", () => { });
                    lobby.onMessage("-", () => { });
                    yield utils_1.timeout(50);
                    assert_1.default.ok(onMessageCalled);
                }));
                it("should receive + when rooms are created", () => __awaiter(void 0, void 0, void 0, function* () {
                    const lobby = yield client.joinOrCreate("lobby");
                    let onMessageCalled = false;
                    let onAddCalled = 0;
                    lobby.onMessage("rooms", (rooms) => {
                        onMessageCalled = true;
                        assert_1.default.equal(0, rooms.length);
                    });
                    lobby.onMessage("+", ([roomId, data]) => {
                        onAddCalled++;
                        assert_1.default.equal("string", typeof (roomId));
                        assert_1.default.equal("dummy_1", data.name);
                    });
                    lobby.onMessage("-", () => { });
                    yield client.create('dummy_1');
                    yield client.create('dummy_1');
                    yield utils_1.timeout(50);
                    assert_1.default.ok(onMessageCalled);
                    // FIXME: currently, it is called 4 times because each onCreate + onJoin are forcing updates
                    // therefore triggering onMessage.
                    assert_1.default.equal(4, onAddCalled);
                }));
                it("should receive - when rooms are removed", () => __awaiter(void 0, void 0, void 0, function* () {
                    const lobby = yield client.joinOrCreate("lobby");
                    let onMessageCalled = false;
                    let onRemoveCalled = 0;
                    lobby.onMessage("rooms", (rooms) => {
                        onMessageCalled = true;
                        assert_1.default.equal(0, rooms.length);
                    });
                    lobby.onMessage("+", () => { });
                    yield client.create('dummy_1');
                    const dummy_1 = yield client.create('dummy_1');
                    const dummyRoomId = dummy_1.id;
                    lobby.onMessage("-", (roomId) => {
                        onRemoveCalled++;
                        assert_1.default.equal(roomId, dummyRoomId);
                    });
                    dummy_1.leave();
                    yield utils_1.timeout(50);
                    assert_1.default.ok(onMessageCalled);
                    assert_1.default.equal(1, onRemoveCalled);
                }));
            });
        }
    }
});
