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
const utils_1 = require("./utils");
const IPC_1 = require("../src/IPC");
describe("Inter-process Communication", () => {
    for (let i = 0; i < utils_1.PRESENCE_IMPLEMENTATIONS.length; i++) {
        const presence = utils_1.PRESENCE_IMPLEMENTATIONS[i];
        describe(`Using presence: ${presence.constructor.name}`, () => {
            it("#subscribeIPC / #publishIPC", () => __awaiter(void 0, void 0, void 0, function* () {
                yield IPC_1.subscribeIPC(presence, "process-one", "channel", (method, args) => {
                    assert_1.default.equal("methodName", method);
                    assert_1.default.deepEqual(["one", 2, { boolean: true }], args);
                    return new Promise((resolve) => {
                        setTimeout(() => resolve(["two", 3, { boolean: true }]), 100);
                    });
                });
                yield assert_1.default.doesNotReject(() => __awaiter(void 0, void 0, void 0, function* () {
                    const response = yield IPC_1.requestFromIPC(presence, "channel", "methodName", ["one", 2, { boolean: true }]);
                    assert_1.default.deepEqual(["two", 3, { boolean: true }], response);
                }));
            }));
            it("#publishIPC should allow 'undefined' methodName", () => __awaiter(void 0, void 0, void 0, function* () {
                const channel = 'test-channel';
                IPC_1.subscribeIPC(presence, "public-ipc-test", channel, (method, args) => {
                    assert_1.default.equal(undefined, method);
                    assert_1.default.deepEqual([true], args);
                    return "hello!";
                });
                yield assert_1.default.doesNotReject(() => __awaiter(void 0, void 0, void 0, function* () {
                    const response = yield IPC_1.requestFromIPC(presence, channel, undefined, [true]);
                    assert_1.default.equal("hello!", response);
                }));
            }));
        });
    }
});
