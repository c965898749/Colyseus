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
const httpClient = __importStar(require("httpie"));
const assert_1 = __importDefault(require("assert"));
const src_1 = require("../src");
const utils_1 = require("./utils");
describe("Server", () => {
    const server = new src_1.Server();
    // bind & unbind server
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve) => {
            // setup matchmaker
            src_1.matchMaker.setup(undefined, undefined, 'dummyProcessId');
            // define a room
            server.define("roomName", utils_1.DummyRoom);
            // listen for testing
            server.listen(8567, undefined, undefined, resolve);
        });
    }));
    after(() => server.transport.shutdown());
    describe("matchmaking routes", () => {
        it("should respond to GET /matchmake/ to retrieve list of rooms", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield httpClient.get("http://localhost:8567/matchmake/");
            assert_1.default.deepEqual(response.data, []);
        }));
        it("should respond to POST /matchmake/joinOrCreate/roomName", () => __awaiter(void 0, void 0, void 0, function* () {
            const { data } = yield httpClient.post("http://localhost:8567/matchmake/joinOrCreate/roomName", {
                body: "{}"
            });
            assert_1.default.ok(data.sessionId);
            assert_1.default.ok(data.room);
            assert_1.default.ok(data.room.processId);
            assert_1.default.ok(data.room.roomId);
            assert_1.default.equal(data.room.name, 'roomName');
        }));
    });
    describe("API", () => {
        it("server.define() should throw error if argument is invalid", () => {
            assert_1.default.throws(() => server.define("dummy", undefined));
        });
    });
});
