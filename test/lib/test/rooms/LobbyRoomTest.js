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
const src_1 = require("../../src");
const utils_1 = require("../utils");
function createLobbyRoom() {
    return __awaiter(this, void 0, void 0, function* () {
        const room = yield src_1.matchMaker.createRoom("lobby", {});
        return src_1.matchMaker.getRoomById(room.roomId);
    });
}
describe("LobbyRoom", () => {
    for (let i = 0; i < utils_1.PRESENCE_IMPLEMENTATIONS.length; i++) {
        const presence = utils_1.PRESENCE_IMPLEMENTATIONS[i];
        for (let j = 0; j < utils_1.DRIVERS.length; j++) {
            const driver = utils_1.DRIVERS[j];
            describe(`Driver => ${driver.constructor.name}, Presence => ${presence.constructor.name}`, () => {
                /**
                 * `setup` matchmaker to re-set graceful shutdown status
                 */
                beforeEach(() => {
                    src_1.matchMaker.setup(presence, driver, 'dummyProcessId');
                    src_1.matchMaker.defineRoomType("lobby", src_1.LobbyRoom);
                    src_1.matchMaker.defineRoomType("dummy_1", utils_1.DummyRoom).enableRealtimeListing();
                    src_1.matchMaker.defineRoomType("dummy_2", utils_1.DummyRoom).enableRealtimeListing();
                });
                /**
                 * ensure no rooms are avaialble in-between tests
                 */
                afterEach(() => __awaiter(void 0, void 0, void 0, function* () { return yield src_1.matchMaker.gracefullyShutdown(); }));
                it("initial room list should be empty", () => __awaiter(void 0, void 0, void 0, function* () {
                    const lobby = yield createLobbyRoom();
                    assert_1.default.equal(0, lobby.rooms.length);
                }));
                it("inital room list should contain existing rooms", () => __awaiter(void 0, void 0, void 0, function* () {
                    yield src_1.matchMaker.create("dummy_1", {});
                    yield src_1.matchMaker.create("dummy_2", {});
                    const lobby = yield createLobbyRoom();
                    assert_1.default.equal(2, lobby.rooms.length);
                }));
                it("should receive update when room is created", () => __awaiter(void 0, void 0, void 0, function* () {
                    const lobby = yield createLobbyRoom();
                    assert_1.default.equal(0, lobby.rooms.length);
                    yield src_1.matchMaker.createRoom("dummy_1", {});
                    // wait a bit until LobbyRoom received the update
                    yield utils_1.timeout(10);
                    assert_1.default.equal(1, lobby.rooms.length);
                }));
            });
        }
    }
});
