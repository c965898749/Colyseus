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
const src_1 = require("../src");
const utils_1 = require("./utils");
const LocalDriver_1 = require("../src/matchmaker/drivers/LocalDriver");
const TEST_PORT = 8567;
const TEST_ENDPOINT = `ws://localhost:${TEST_PORT}`;
describe("Room Integration", () => {
    const presence = new src_1.LocalPresence();
    const driver = new LocalDriver_1.LocalDriver();
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
        // listen for testing
        yield server.listen(TEST_PORT);
    }));
    after(() => server.transport.shutdown());
    describe("FossilDeltaSerializer", () => {
        it("should transfer patches", () => __awaiter(void 0, void 0, void 0, function* () {
            src_1.matchMaker.defineRoomType('fossil-delta', class _ extends src_1.Room {
                onCreate() {
                    this.setState({ hello: "world!" });
                    this.onMessage("*", (_, type) => {
                        this.state.hello = type;
                    });
                }
            });
            const conn = yield client.joinOrCreate('fossil-delta');
            yield utils_1.timeout(10);
            assert_1.default.deepEqual({ hello: "world!" }, conn.state, "receive initial state");
            conn.send("mutate");
            yield utils_1.timeout(50);
            assert_1.default.deepEqual({ hello: "mutate" }, conn.state, "receive patch");
        }));
    });
});
