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
const benchmark_1 = __importDefault(require("benchmark"));
const src_1 = require("../../src");
const ws_1 = __importDefault(require("ws"));
const Utils_1 = require("../../src/Utils");
const notepack_io_1 = __importDefault(require("notepack.io"));
const numClients = 5;
const suite = new benchmark_1.default.Suite();
const connections = [];
class MyRoom extends src_1.Room {
    onCreate() { this.setSeatReservationTime(10); }
    onMessage() { }
}
let received = 0;
const server = new src_1.Server();
server.define("room", MyRoom);
server.listen(9999, undefined, undefined, () => __awaiter(void 0, void 0, void 0, function* () {
    const roomCreated = yield src_1.matchMaker.createRoom("room", {});
    const room = src_1.matchMaker.getRoomById(roomCreated.roomId);
    const future = new Utils_1.Deferred();
    // add dumb clients
    for (let i = 0; i < numClients; i++) {
        const seatReservation = yield src_1.matchMaker.reserveSeatFor(roomCreated, {});
        const room = new ws_1.default(`ws://localhost:9999/${seatReservation.room.processId}/${seatReservation.room.roomId}?sessionId=${seatReservation.sessionId}`);
        room.on("open", () => {
            connections.push(room);
            room.on("message", (message) => {
                room.send(notepack_io_1.default.encode([src_1.Protocol.JOIN_ROOM]), { binary: true }, (err) => {
                    // give some time for confirmation to be acknowledged
                    if (connections.length === numClients) {
                        setTimeout(() => future.resolve(), 100);
                    }
                });
            });
        });
    }
    yield future.promise;
    console.log("ALL CONNECTIONS OPEN!");
    /**
     * 0.11.x =>
     * broadcast x 7,478 ops/sec ±16.50% (60 runs sampled)
     * broadcast x 2,606 ops/sec ±35.69% (52 runs sampled)
     * broadcast x 6,293 ops/sec ±14.92% (58 runs sampled)
     */
    /**
     * 0.12.x =>
     * broadcast x 27,069 ops/sec ±24.11% (61 runs sampled)
     * broadcast x 25,954 ops/sec ±27.80% (65 runs sampled)
     */
    suite.add('broadcast', function () {
        room.broadcast("hello world!");
    });
    suite.on('cycle', (event) => {
        console.log(String(event.target));
    });
    suite.on('complete', function (event) {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
        process.exit();
    });
    suite.run();
}));
