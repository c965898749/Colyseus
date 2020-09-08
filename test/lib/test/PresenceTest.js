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
describe("Presence", () => {
    for (let i = 0; i < utils_1.PRESENCE_IMPLEMENTATIONS.length; i++) {
        const presence = utils_1.PRESENCE_IMPLEMENTATIONS[i];
        describe(presence.constructor.name, () => {
            it("subscribe", (done) => {
                let i = 0;
                presence.subscribe("topic", (data) => {
                    if (i === 0) {
                        assert_1.default.equal("string", data);
                    }
                    else if (i === 1) {
                        assert_1.default.equal(1000, data);
                    }
                    else if (i === 2) {
                        assert_1.default.deepEqual({ object: "hello world" }, data);
                    }
                    i++;
                    if (i === 3) {
                        presence.unsubscribe("topic");
                        done();
                    }
                });
                presence.publish("topic", "string");
                presence.publish("topic", 1000);
                presence.publish("topic", { object: "hello world" });
            });
            it("subscribe: multiple callbacks for same topic", () => __awaiter(void 0, void 0, void 0, function* () {
                let messages = [];
                const callback1 = (data) => messages.push(data);
                const callback2 = (data) => messages.push(data);
                const callback3 = (data) => messages.push(data);
                yield presence.subscribe("topic-multi", callback1);
                yield presence.subscribe("topic-multi", callback2);
                yield presence.subscribe("topic-multi", callback3);
                yield presence.publish("topic-multi", 1);
                yield utils_1.timeout(10);
                assert_1.default.deepEqual([1, 1, 1], messages);
                yield presence.unsubscribe("topic-multi", callback1);
                yield presence.publish("topic-multi", 1);
                yield utils_1.timeout(10);
                assert_1.default.deepEqual([1, 1, 1, 1, 1], messages);
            }));
            it("subscribe: topics should not collide", () => __awaiter(void 0, void 0, void 0, function* () {
                let messages = [];
                const callback1 = (data) => messages.push(data);
                const callback2 = (data) => messages.push(data);
                const callback3 = (data) => messages.push(data);
                const callback4 = (data) => messages.push(data);
                // subscribe to each topic twice
                yield presence.subscribe("topic-collide1", callback1);
                yield presence.subscribe("topic-collide1", callback2);
                yield presence.subscribe("topic-collide2", callback3);
                yield presence.subscribe("topic-collide2", callback4);
                yield presence.publish("topic-collide1", 1);
                yield presence.publish("topic-collide1", 2);
                yield presence.publish("topic-collide2", 3);
                yield presence.publish("topic-collide2", 4);
                yield utils_1.timeout(10);
                assert_1.default.deepEqual([1, 1, 2, 2, 3, 3, 4, 4], messages);
                // leave duplicated subscriptions
                yield presence.unsubscribe("topic-collide1", callback2);
                yield presence.unsubscribe("topic-collide2", callback4);
                messages = [];
                yield presence.publish("topic-collide1", 1);
                yield presence.publish("topic-collide1", 2);
                yield presence.publish("topic-collide2", 3);
                yield presence.publish("topic-collide2", 4);
                yield utils_1.timeout(10);
                assert_1.default.deepEqual([1, 2, 3, 4], messages);
                // leave all subscriptions...
                yield presence.unsubscribe("topic-collide1", callback1);
                yield presence.unsubscribe("topic-collide2", callback3);
                messages = [];
                yield presence.publish("topic-collide1", 1000);
                yield presence.publish("topic-collide2", 2000);
                yield utils_1.timeout(10);
                assert_1.default.deepEqual([], messages);
            }));
            it("unsubscribe", () => __awaiter(void 0, void 0, void 0, function* () {
                presence.subscribe("topic2", (_) => assert_1.default.fail("should not trigger"));
                presence.unsubscribe("topic2");
                presence.publish("topic2", "hello world!");
                assert_1.default.ok(true);
            }));
            it("exists", () => __awaiter(void 0, void 0, void 0, function* () {
                yield presence.subscribe("exists1", () => { });
                assert_1.default.equal(true, yield presence.exists("exists1"));
                assert_1.default.equal(false, yield presence.exists("exists2"));
            }));
            it("setex", () => __awaiter(void 0, void 0, void 0, function* () {
                yield presence.setex("setex1", "hello world", 1);
                assert_1.default.equal("hello world", yield presence.get("setex1"));
                yield utils_1.timeout(1100);
                assert_1.default.ok(!(yield presence.get("setex1")));
            }));
            it("get", () => __awaiter(void 0, void 0, void 0, function* () {
                yield presence.setex("setex2", "one", 1);
                assert_1.default.equal("one", yield presence.get("setex2"));
                yield presence.setex("setex3", "two", 1);
                assert_1.default.equal("two", yield presence.get("setex3"));
            }));
            it("del", () => __awaiter(void 0, void 0, void 0, function* () {
                yield presence.setex("setex4", "one", 1);
                yield presence.del("setex4");
                assert_1.default.ok(!(yield presence.get("setex4")));
            }));
            it("sadd/smembers/srem (sets)", () => __awaiter(void 0, void 0, void 0, function* () {
                yield presence.sadd("set", 1);
                yield presence.sadd("set", 2);
                yield presence.sadd("set", 3);
                assert_1.default.deepEqual([1, 2, 3], yield presence.smembers("set"));
                assert_1.default.equal(3, yield presence.scard("set"));
                yield presence.srem("set", 2);
                assert_1.default.deepEqual([1, 3], yield presence.smembers("set"));
                assert_1.default.equal(2, yield presence.scard("set"));
                yield presence.del("set");
                assert_1.default.equal(0, yield presence.scard("set"));
            }));
            it("sismember", () => __awaiter(void 0, void 0, void 0, function* () {
                yield presence.sadd("sis", "testvalue");
                yield presence.sadd("sis", "anothervalue");
                assert_1.default.equal(1, yield presence.sismember("sis", "testvalue"));
                assert_1.default.equal(1, yield presence.sismember("sis", "anothervalue"));
                assert_1.default.equal(0, yield presence.sismember("sis", "notexistskey"));
            }));
            it("sinter - intersection between sets", () => __awaiter(void 0, void 0, void 0, function* () {
                yield presence.sadd("key1", "a");
                yield presence.sadd("key1", "b");
                yield presence.sadd("key1", "c");
                yield presence.sadd("key2", "c");
                yield presence.sadd("key2", "d");
                yield presence.sadd("key2", "e");
                const intersection = yield presence.sinter("key1", "key2");
                assert_1.default.deepEqual(["c"], intersection);
            }));
            it("hset/hget/hdel/hlen (hashes)", () => __awaiter(void 0, void 0, void 0, function* () {
                yield presence.hset("hash", "one", "1");
                yield presence.hset("hash", "two", "2");
                yield presence.hset("hash", "three", "3");
                assert_1.default.equal(3, yield presence.hlen("hash"));
                assert_1.default.equal("1", yield presence.hget("hash", "one"));
                assert_1.default.equal("2", yield presence.hget("hash", "two"));
                assert_1.default.equal("3", yield presence.hget("hash", "three"));
                assert_1.default.ok(!(yield presence.hget("hash", "four")));
                yield presence.hdel("hash", "two");
                assert_1.default.equal(2, yield presence.hlen("hash"));
                assert_1.default.ok(!(yield presence.hget("hash", "two")));
            }));
            it("incr", () => __awaiter(void 0, void 0, void 0, function* () {
                yield presence.del("num"); //ensure key doens't exist before testing
                yield presence.incr("num");
                yield presence.incr("num");
                yield presence.incr("num");
                assert_1.default.equal(3, yield presence.get("num"));
            }));
            it("decr", () => __awaiter(void 0, void 0, void 0, function* () {
                yield presence.del("num"); //ensure key doens't exist before testing
                yield presence.decr("num");
                yield presence.decr("num");
                yield presence.decr("num");
                assert_1.default.equal(-3, yield presence.get("num"));
            }));
        });
    }
});
