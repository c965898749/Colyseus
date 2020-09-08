"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const src_1 = require("../src");
const schema_1 = require("@colyseus/schema");
describe("Room", () => {
    describe("FossilDeltaSerializer", () => {
        class MyRoom extends src_1.Room {
            onCreate() { this.setState({}); }
            onMessage() { }
        }
        it("setState() should select correct serializer", () => {
            const room = new MyRoom();
            room.onCreate();
            assert_1.default.ok(room['_serializer'] instanceof src_1.FossilDeltaSerializer);
        });
    });
    describe("SchemaSerializer", () => {
        class State extends schema_1.Schema {
        }
        class MyRoom extends src_1.Room {
            onCreate() { this.setState(new State()); }
            onMessage() { }
        }
        it("setState() should select correct serializer", () => {
            const room = new MyRoom();
            room.onCreate();
            assert_1.default.ok(room['_serializer'] instanceof src_1.SchemaSerializer);
        });
    });
});
