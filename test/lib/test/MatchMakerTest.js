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
const assert_1 = __importDefault(require("assert"));
const src_1 = require("../src");
const utils_1 = require("./utils");
const Room_1 = require("../src/Room");
describe("MatchMaker", () => {
    /**
     * register room types
     */
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        src_1.matchMaker.defineRoomType("empty", utils_1.DummyRoom);
        src_1.matchMaker.defineRoomType("dummy", utils_1.DummyRoom);
        src_1.matchMaker.defineRoomType("room2", utils_1.Room2Clients);
        src_1.matchMaker.defineRoomType("room3", utils_1.Room3Clients);
        src_1.matchMaker.defineRoomType("reconnect", utils_1.ReconnectRoom);
        src_1.matchMaker.defineRoomType("reconnect_token", utils_1.ReconnectTokenRoom);
        src_1.matchMaker
            .defineRoomType("room2_filtered", utils_1.Room2Clients)
            .filterBy(['mode']);
        src_1.matchMaker
            .defineRoomType("room3_sorted_desc", utils_1.Room3Clients)
            .filterBy(['clients'])
            .sortBy({ clients: -1 });
        src_1.matchMaker
            .defineRoomType("room3_sorted_asc", utils_1.Room3Clients)
            .filterBy(['clients'])
            .sortBy({ clients: 1 });
        /**
         * give some time for `cleanupStaleRooms()` to run
         */
        yield utils_1.timeout(50);
    }));
    for (let i = 0; i < utils_1.DRIVERS.length; i++) {
        const driver = utils_1.DRIVERS[i];
        describe(`Driver: ${driver.constructor.name}`, () => {
            /**
             * `setup` matchmaker to re-set graceful shutdown status
             */
            beforeEach(() => src_1.matchMaker.setup(undefined, driver, 'dummyProcessId'));
            /**
             * ensure no rooms are avaialble in-between tests
             */
            afterEach(() => __awaiter(void 0, void 0, void 0, function* () { return yield src_1.matchMaker.gracefullyShutdown(); }));
            describe("exposed methods", () => {
                it("joinOrCreate() should create a new room", () => __awaiter(void 0, void 0, void 0, function* () {
                    const reservedSeat = yield src_1.matchMaker.joinOrCreate("dummy");
                    const room = src_1.matchMaker.getRoomById(reservedSeat.room.roomId);
                    assert_1.default.ok(room.hasReservedSeat(reservedSeat.sessionId));
                    assert_1.default.ok(room instanceof src_1.Room);
                    assert_1.default.ok(room instanceof utils_1.DummyRoom);
                }));
                it("joinOrCreate() should not find private rooms", () => __awaiter(void 0, void 0, void 0, function* () {
                    const reservedSeat = yield src_1.matchMaker.joinOrCreate("dummy");
                    const room = src_1.matchMaker.getRoomById(reservedSeat.room.roomId);
                    yield room.setPrivate();
                    const reservedSeat2 = yield src_1.matchMaker.joinOrCreate("dummy");
                    assert_1.default.notEqual(reservedSeat2.room.roomId, reservedSeat.room.roomId, "should not join a private room");
                }));
                it("joinOrCreate() should not find locked rooms", () => __awaiter(void 0, void 0, void 0, function* () {
                    const reservedSeat = yield src_1.matchMaker.joinOrCreate("dummy");
                    const room = src_1.matchMaker.getRoomById(reservedSeat.room.roomId);
                    yield room.lock();
                    const reservedSeat2 = yield src_1.matchMaker.joinOrCreate("dummy");
                    assert_1.default.notEqual(reservedSeat2.room.roomId, reservedSeat.room.roomId, "should not join a locked room");
                }));
                it("join() should fail if room doesn't exist", () => __awaiter(void 0, void 0, void 0, function* () {
                    yield assert_1.default.rejects(() => __awaiter(void 0, void 0, void 0, function* () { return yield src_1.matchMaker.join("empty"); }), /no rooms found/i);
                }));
                it("join() should succeed if room exists", () => __awaiter(void 0, void 0, void 0, function* () {
                    const reservedSeat1 = yield src_1.matchMaker.joinOrCreate("dummy");
                    const reservedSeat2 = yield src_1.matchMaker.join("dummy");
                    const room = src_1.matchMaker.getRoomById(reservedSeat2.room.roomId);
                    assert_1.default.equal(reservedSeat1.room.roomId, reservedSeat2.room.roomId);
                    assert_1.default.ok(room.hasReservedSeat(reservedSeat2.sessionId));
                }));
                it("create() should create a new room", () => __awaiter(void 0, void 0, void 0, function* () {
                    const reservedSeat1 = yield src_1.matchMaker.joinOrCreate("dummy");
                    const reservedSeat2 = yield src_1.matchMaker.create("dummy");
                    const room = src_1.matchMaker.getRoomById(reservedSeat2.room.roomId);
                    assert_1.default.notEqual(reservedSeat1.room.roomId, reservedSeat2.room.roomId);
                    assert_1.default.ok(reservedSeat2.room.roomId);
                    assert_1.default.ok(room.hasReservedSeat(reservedSeat2.sessionId));
                }));
                it("joinById() should allow to join a room by id", () => __awaiter(void 0, void 0, void 0, function* () {
                    const reservedSeat1 = yield src_1.matchMaker.create("room2");
                    const reservedSeat2 = yield src_1.matchMaker.joinById(reservedSeat1.room.roomId);
                    const room = src_1.matchMaker.getRoomById(reservedSeat2.room.roomId);
                    assert_1.default.equal(reservedSeat1.room.roomId, reservedSeat2.room.roomId);
                    assert_1.default.ok(room.hasReservedSeat(reservedSeat2.sessionId));
                }));
                it("joinById() should not allow to join a locked room", () => __awaiter(void 0, void 0, void 0, function* () {
                    const reservedSeat1 = yield src_1.matchMaker.create("room2");
                    yield src_1.matchMaker.joinById(reservedSeat1.room.roomId);
                    yield assert_1.default.rejects(() => __awaiter(void 0, void 0, void 0, function* () { return yield src_1.matchMaker.joinById(reservedSeat1.room.roomId); }), /locked/i);
                }));
                it("joinById() should allow to join a private room", () => __awaiter(void 0, void 0, void 0, function* () {
                    const reservedSeat1 = yield src_1.matchMaker.create("room2");
                    const room = src_1.matchMaker.getRoomById(reservedSeat1.room.roomId);
                    yield room.setPrivate();
                    const reservedSeat2 = yield src_1.matchMaker.joinById(reservedSeat1.room.roomId);
                    assert_1.default.equal(reservedSeat1.room.roomId, reservedSeat2.room.roomId);
                }));
                it("should throw error trying to create a room not defined", () => __awaiter(void 0, void 0, void 0, function* () {
                    yield assert_1.default.rejects(() => __awaiter(void 0, void 0, void 0, function* () { return yield src_1.matchMaker.joinOrCreate("non_existing_room"); }), /not defined/i);
                    yield assert_1.default.rejects(() => __awaiter(void 0, void 0, void 0, function* () { return yield src_1.matchMaker.create("non_existing_room"); }), /not defined/i);
                }));
                it("filterBy(): filter by 'mode' field", () => __awaiter(void 0, void 0, void 0, function* () {
                    const reservedSeat1 = yield src_1.matchMaker.joinOrCreate("room2_filtered", { mode: "squad" });
                    const reservedSeat2 = yield src_1.matchMaker.joinOrCreate("room2_filtered", { mode: "duo" });
                    assert_1.default.notEqual(reservedSeat1.room.roomId, reservedSeat2.room.roomId);
                    const reservedSeat3 = yield src_1.matchMaker.joinOrCreate("room2_filtered", { mode: "squad" });
                    const reservedSeat4 = yield src_1.matchMaker.joinOrCreate("room2_filtered", { mode: "duo" });
                    assert_1.default.equal(reservedSeat1.room.roomId, reservedSeat3.room.roomId);
                    assert_1.default.equal(reservedSeat2.room.roomId, reservedSeat4.room.roomId);
                }));
                it("sortBy(): sort desc by 'clients' field", () => __awaiter(void 0, void 0, void 0, function* () {
                    const room1 = yield src_1.matchMaker.createRoom("room3_sorted_desc", {});
                    const room2 = yield src_1.matchMaker.createRoom("room3_sorted_desc", {});
                    const room3 = yield src_1.matchMaker.createRoom("room3_sorted_desc", {});
                    const reservedSeat1 = yield src_1.matchMaker.join("room3_sorted_desc");
                    assert_1.default.equal(room1.roomId, reservedSeat1.room.roomId);
                    const reservedSeat2 = yield src_1.matchMaker.join("room3_sorted_desc");
                    assert_1.default.equal(room1.roomId, reservedSeat2.room.roomId);
                    const reservedSeat3 = yield src_1.matchMaker.join("room3_sorted_desc");
                    assert_1.default.equal(room1.roomId, reservedSeat3.room.roomId);
                    const reservedSeat4 = yield src_1.matchMaker.join("room3_sorted_desc");
                    assert_1.default.equal(room2.roomId, reservedSeat4.room.roomId);
                    const reservedSeat5 = yield src_1.matchMaker.join("room3_sorted_desc");
                    assert_1.default.equal(room2.roomId, reservedSeat5.room.roomId);
                    const reservedSeat6 = yield src_1.matchMaker.join("room3_sorted_desc");
                    assert_1.default.equal(room2.roomId, reservedSeat6.room.roomId);
                    const reservedSeat7 = yield src_1.matchMaker.join("room3_sorted_desc");
                    assert_1.default.equal(room3.roomId, reservedSeat7.room.roomId);
                    const reservedSeat8 = yield src_1.matchMaker.join("room3_sorted_desc");
                    assert_1.default.equal(room3.roomId, reservedSeat8.room.roomId);
                    const reservedSeat9 = yield src_1.matchMaker.join("room3_sorted_desc");
                    assert_1.default.equal(room3.roomId, reservedSeat9.room.roomId);
                }));
                it("sortBy(): sort asc by 'clients' field", () => __awaiter(void 0, void 0, void 0, function* () {
                    const room1 = yield src_1.matchMaker.createRoom("room3_sorted_asc", {});
                    const room2 = yield src_1.matchMaker.createRoom("room3_sorted_asc", {});
                    const room3 = yield src_1.matchMaker.createRoom("room3_sorted_asc", {});
                    const reservedSeat1 = yield src_1.matchMaker.join("room3_sorted_asc");
                    assert_1.default.equal(room1.roomId, reservedSeat1.room.roomId);
                    const reservedSeat2 = yield src_1.matchMaker.join("room3_sorted_asc");
                    assert_1.default.equal(room2.roomId, reservedSeat2.room.roomId);
                    const reservedSeat3 = yield src_1.matchMaker.join("room3_sorted_asc");
                    assert_1.default.equal(room3.roomId, reservedSeat3.room.roomId);
                    const reservedSeat4 = yield src_1.matchMaker.join("room3_sorted_asc");
                    assert_1.default.equal(room1.roomId, reservedSeat4.room.roomId);
                    const reservedSeat5 = yield src_1.matchMaker.join("room3_sorted_asc");
                    assert_1.default.equal(room2.roomId, reservedSeat5.room.roomId);
                    const reservedSeat6 = yield src_1.matchMaker.join("room3_sorted_asc");
                    assert_1.default.equal(room3.roomId, reservedSeat6.room.roomId);
                    const reservedSeat7 = yield src_1.matchMaker.join("room3_sorted_asc");
                    assert_1.default.equal(room1.roomId, reservedSeat7.room.roomId);
                    const reservedSeat8 = yield src_1.matchMaker.join("room3_sorted_asc");
                    assert_1.default.equal(room2.roomId, reservedSeat8.room.roomId);
                    const reservedSeat9 = yield src_1.matchMaker.join("room3_sorted_asc");
                    assert_1.default.equal(room3.roomId, reservedSeat9.room.roomId);
                }));
            });
            describe("query() for cached rooms", () => {
                it("should list all", () => __awaiter(void 0, void 0, void 0, function* () {
                    // create 4 rooms
                    for (let i = 0; i < 4; i++) {
                        yield src_1.matchMaker.create("dummy");
                    }
                    const rooms = yield src_1.matchMaker.query({});
                    assert_1.default.equal(4, rooms.length);
                }));
                it("should list only public and unlocked rooms", () => __awaiter(void 0, void 0, void 0, function* () {
                    // create 4 public rooms
                    for (let i = 0; i < 4; i++) {
                        yield src_1.matchMaker.create("dummy");
                    }
                    // create 2 private rooms
                    for (let i = 0; i < 2; i++) {
                        const reservedSeat = yield src_1.matchMaker.create("dummy");
                        yield src_1.matchMaker.remoteRoomCall(reservedSeat.room.roomId, "setPrivate");
                    }
                    //
                    for (let i = 0; i < 2; i++) {
                        const reservedSeat = yield src_1.matchMaker.create("dummy");
                        yield src_1.matchMaker.remoteRoomCall(reservedSeat.room.roomId, "lock");
                    }
                    assert_1.default.equal(8, (yield src_1.matchMaker.query({})).length);
                    assert_1.default.equal(6, (yield src_1.matchMaker.query({ private: false })).length);
                    assert_1.default.equal(4, (yield src_1.matchMaker.query({ private: false, locked: false })).length);
                }));
            });
            describe("reconnect", () => __awaiter(void 0, void 0, void 0, function* () {
                it("should allow to reconnect", () => __awaiter(void 0, void 0, void 0, function* () {
                    const reservedSeat1 = yield src_1.matchMaker.joinOrCreate("reconnect");
                    const client1 = utils_1.createDummyClient(reservedSeat1);
                    const room = src_1.matchMaker.getRoomById(reservedSeat1.room.roomId);
                    yield room._onJoin(client1);
                    assert_1.default.equal(1, room.clients.length);
                    client1.close();
                    yield utils_1.timeout(100);
                    let rooms = yield src_1.matchMaker.query({});
                    assert_1.default.equal(1, rooms.length);
                    assert_1.default.equal(1, rooms[0].clients, "should keep seat reservation after disconnection");
                    yield src_1.matchMaker.joinById(room.roomId, { sessionId: client1.sessionId });
                    yield room._onJoin(client1);
                    rooms = yield src_1.matchMaker.query({});
                    assert_1.default.equal(1, rooms.length);
                    assert_1.default.equal(1, rooms[0].clients);
                    assert_1.default.equal(1, room.clients.length);
                    client1.close();
                    yield utils_1.timeout(100);
                }));
                it("should not allow to reconnect", () => __awaiter(void 0, void 0, void 0, function* () {
                    const reservedSeat1 = yield src_1.matchMaker.joinOrCreate("reconnect");
                    const reservedSeat2 = yield src_1.matchMaker.joinOrCreate("reconnect");
                    const client1 = utils_1.createDummyClient(reservedSeat1);
                    const room = src_1.matchMaker.getRoomById(reservedSeat1.room.roomId);
                    yield room._onJoin(client1);
                    /**
                     * Create a second client so the room won't dispose
                     */
                    const client2 = utils_1.createDummyClient(reservedSeat2);
                    yield room._onJoin(client2);
                    assert_1.default.equal(2, room.clients.length);
                    client1.close();
                    yield utils_1.timeout(250);
                    assert_1.default.equal(1, room.clients.length);
                    yield assert_1.default.rejects(() => __awaiter(void 0, void 0, void 0, function* () { return yield src_1.matchMaker.joinById(room.roomId, { sessionId: client1.sessionId }); }), /expired/);
                }));
                it("using token: should allow to reconnect", () => __awaiter(void 0, void 0, void 0, function* () {
                    const reservedSeat1 = yield src_1.matchMaker.joinOrCreate("reconnect_token");
                    const client1 = utils_1.createDummyClient(reservedSeat1);
                    const room = src_1.matchMaker.getRoomById(reservedSeat1.room.roomId);
                    yield room._onJoin(client1);
                    assert_1.default.equal(1, room.clients.length);
                    client1.close();
                    yield utils_1.timeout(100);
                    let rooms = yield src_1.matchMaker.query({});
                    assert_1.default.equal(1, rooms.length);
                    assert_1.default.equal(1, rooms[0].clients, "should keep seat reservation after disconnection");
                    yield src_1.matchMaker.joinById(room.roomId, { sessionId: client1.sessionId });
                    yield room._onJoin(client1);
                    rooms = yield src_1.matchMaker.query({});
                    assert_1.default.equal(1, rooms.length);
                    assert_1.default.equal(1, rooms[0].clients);
                    assert_1.default.equal(1, room.clients.length);
                    client1.close();
                    yield utils_1.timeout(100);
                }));
                it("using token: should not allow to reconnect", () => __awaiter(void 0, void 0, void 0, function* () {
                    const reservedSeat1 = yield src_1.matchMaker.joinOrCreate("reconnect_token");
                    const reservedSeat2 = yield src_1.matchMaker.joinOrCreate("reconnect_token");
                    const client1 = utils_1.createDummyClient(reservedSeat1);
                    const room = src_1.matchMaker.getRoomById(reservedSeat1.room.roomId);
                    yield room._onJoin(client1);
                    /**
                     * Create a second client so the room won't dispose
                     */
                    const client2 = utils_1.createDummyClient(reservedSeat2);
                    yield room._onJoin(client2);
                    assert_1.default.equal(2, room.clients.length);
                    client1.close();
                    yield utils_1.timeout(100);
                    room.token.reject();
                    yield utils_1.timeout(100);
                    assert_1.default.equal(1, room.clients.length);
                    yield assert_1.default.rejects(() => __awaiter(void 0, void 0, void 0, function* () { return yield src_1.matchMaker.joinById(room.roomId, { sessionId: client1.sessionId }); }), /expired/);
                }));
            }));
            // define the same tests using multiple drivers
            it("when `maxClients` is reached, the room should be locked", () => __awaiter(void 0, void 0, void 0, function* () {
                // first client joins
                const reservedSeat1 = yield src_1.matchMaker.joinOrCreate("room3");
                const room = src_1.matchMaker.getRoomById(reservedSeat1.room.roomId);
                assert_1.default.equal(false, room.locked);
                // more 2 clients join
                yield src_1.matchMaker.joinOrCreate("room3");
                yield src_1.matchMaker.joinOrCreate("room3");
                const roomsBeforeExpiration = yield src_1.matchMaker.query({});
                assert_1.default.equal(1, roomsBeforeExpiration.length);
                assert_1.default.equal(3, roomsBeforeExpiration[0].clients);
                assert_1.default.equal(true, room.locked);
                assert_1.default.equal(true, roomsBeforeExpiration[0].locked);
            }));
            it("seat reservation should expire", () => __awaiter(void 0, void 0, void 0, function* () {
                const reservedSeat1 = yield src_1.matchMaker.joinOrCreate("room3");
                const room = src_1.matchMaker.getRoomById(reservedSeat1.room.roomId);
                assert_1.default.equal(false, room.locked);
                // more 2 clients join
                yield src_1.matchMaker.joinOrCreate("room3");
                yield src_1.matchMaker.joinOrCreate("room3");
                const roomsBeforeExpiration = yield src_1.matchMaker.query({});
                assert_1.default.equal(1, roomsBeforeExpiration.length);
                assert_1.default.equal(3, roomsBeforeExpiration[0].clients);
                assert_1.default.equal(true, roomsBeforeExpiration[0].locked);
                // only 1 client actually joins the room, 2 of them are going to expire
                yield room._onJoin(utils_1.createDummyClient(reservedSeat1));
                yield utils_1.timeout(Room_1.DEFAULT_SEAT_RESERVATION_TIME * 1100);
                // connect 2 clients to the same room again
                yield src_1.matchMaker.joinOrCreate("room3");
                yield src_1.matchMaker.joinOrCreate("room3");
                const roomsAfterExpiration2 = yield src_1.matchMaker.query({});
                assert_1.default.equal(1, roomsAfterExpiration2.length);
                assert_1.default.equal(3, roomsAfterExpiration2[0].clients);
                assert_1.default.equal(true, roomsAfterExpiration2[0].locked);
            }));
            it("should automatically lock rooms", () => __awaiter(void 0, void 0, void 0, function* () {
                yield src_1.matchMaker.joinOrCreate("room3");
                yield src_1.matchMaker.joinOrCreate("room3");
                yield src_1.matchMaker.joinOrCreate("room3");
                let rooms = yield src_1.matchMaker.query({});
                assert_1.default.equal(1, rooms.length);
                assert_1.default.equal(3, rooms[0].clients);
                assert_1.default.equal(true, rooms[0].locked);
                yield src_1.matchMaker.joinOrCreate("room3");
                rooms = yield src_1.matchMaker.query({});
                assert_1.default.equal(2, rooms.length);
                assert_1.default.equal(3, rooms[0].clients);
                assert_1.default.equal(1, rooms[1].clients);
                assert_1.default.equal(true, rooms[0].locked);
                assert_1.default.equal(false, rooms[1].locked);
            }));
            it("should allow to manually lock rooms", () => __awaiter(void 0, void 0, void 0, function* () {
                const reservedSeat1 = yield src_1.matchMaker.joinOrCreate("room3");
                yield src_1.matchMaker.remoteRoomCall(reservedSeat1.room.roomId, "lock");
                const reservedSeat2 = yield src_1.matchMaker.joinOrCreate("room3");
                yield src_1.matchMaker.remoteRoomCall(reservedSeat2.room.roomId, "lock");
                const reservedSeat3 = yield src_1.matchMaker.joinOrCreate("room3");
                yield src_1.matchMaker.remoteRoomCall(reservedSeat3.room.roomId, "lock");
                let rooms = yield src_1.matchMaker.query({});
                assert_1.default.equal(3, rooms.length);
                assert_1.default.equal(true, rooms[0].locked);
                assert_1.default.equal(true, rooms[1].locked);
                assert_1.default.equal(true, rooms[2].locked);
            }));
            describe("concurrency", () => __awaiter(void 0, void 0, void 0, function* () {
                it("should create 50 rooms", () => __awaiter(void 0, void 0, void 0, function* () {
                    const numConnections = 100;
                    const promises = [];
                    for (let i = 0; i < numConnections; i++) {
                        promises.push(new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                            try {
                                const reservedSeat = yield src_1.matchMaker.joinOrCreate("room2");
                                const room = src_1.matchMaker.getRoomById(reservedSeat.room.roomId);
                                yield room._onJoin(utils_1.createDummyClient(reservedSeat));
                                resolve();
                            }
                            catch (e) {
                                reject();
                            }
                        })));
                    }
                    // await for all calls to be complete
                    const results = yield Promise.all(promises);
                    assert_1.default.equal(100, results.length);
                    const rooms = yield src_1.matchMaker.query({});
                    assert_1.default.equal(50, rooms.length);
                    for (let i = 0; i < Math.floor(numConnections / 2); i++) {
                        assert_1.default.equal(2, rooms[i].clients);
                        assert_1.default.equal(true, rooms[i].locked);
                    }
                }));
            }));
        });
    }
});
