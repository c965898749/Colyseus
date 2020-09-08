"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const schema_1 = require("@colyseus/schema");
const src_1 = require("../src");
describe("SchemaSerializer", () => {
    const serializer = new src_1.SchemaSerializer();
    describe("hasFilter", () => {
        it("should return false", () => {
            class State extends schema_1.Schema {
            }
            __decorate([
                schema_1.type("string")
            ], State.prototype, "str", void 0);
            assert_1.default.ok(!serializer.hasFilter(State._schema, State._filters));
        });
        it("should return true", () => {
            class State extends schema_1.Schema {
            }
            __decorate([
                schema_1.filter(function (client, value, root) {
                    return true;
                }),
                schema_1.type("string")
            ], State.prototype, "str", void 0);
            assert_1.default.ok(serializer.hasFilter(State._schema, State._filters));
        });
        it("should be able to navigate on recursive structures", () => {
            class Container extends schema_1.Schema {
            }
            __decorate([
                schema_1.type("string")
            ], Container.prototype, "name", void 0);
            __decorate([
                schema_1.type([Container])
            ], Container.prototype, "arrayOfContainers", void 0);
            __decorate([
                schema_1.type({ map: Container })
            ], Container.prototype, "mapOfContainers", void 0);
            class State extends schema_1.Schema {
            }
            __decorate([
                schema_1.type(Container)
            ], State.prototype, "root", void 0);
            const fun = () => serializer.hasFilter(State._schema, State._filters);
            assert_1.default.doesNotThrow(fun);
            assert_1.default.equal(false, fun());
        });
        it("should be able to navigate on more complex recursive structures", () => {
            class ContainerA extends schema_1.Schema {
            }
            __decorate([
                schema_1.type("string")
            ], ContainerA.prototype, "contAName", void 0);
            class ContainerB extends schema_1.Schema {
            }
            __decorate([
                schema_1.type("string")
            ], ContainerB.prototype, "contBName", void 0);
            class State extends schema_1.Schema {
            }
            const allContainers = [State, ContainerA, ContainerB];
            allContainers.forEach((cont) => {
                schema_1.defineTypes(cont, {
                    containersA: [ContainerA],
                    containersB: [ContainerB],
                });
            });
            const fun = () => serializer.hasFilter(State._schema, State._filters);
            assert_1.default.doesNotThrow(fun);
            assert_1.default.equal(false, fun());
        });
        it("should find filter on more complex recursive structures", () => {
            class ContainerA extends schema_1.Schema {
            }
            __decorate([
                schema_1.type("string")
            ], ContainerA.prototype, "contAName", void 0);
            class ContainerB extends schema_1.Schema {
            }
            __decorate([
                schema_1.filter(function (client, value, root) { return true; }),
                schema_1.type("string")
            ], ContainerB.prototype, "contBName", void 0);
            class State extends schema_1.Schema {
            }
            const allContainers = [State, ContainerA, ContainerB];
            allContainers.forEach((cont) => {
                schema_1.defineTypes(cont, {
                    containersA: [ContainerA],
                    containersB: [ContainerB],
                });
            });
            assert_1.default.ok(serializer.hasFilter(State._schema, State._filters));
        });
        it("should be able to navigate on maps and arrays of primitive types", () => {
            class State extends schema_1.Schema {
            }
            __decorate([
                schema_1.type(["string"])
            ], State.prototype, "stringArr", void 0);
            __decorate([
                schema_1.type(["number"])
            ], State.prototype, "numberArr", void 0);
            __decorate([
                schema_1.type(["boolean"])
            ], State.prototype, "booleanArr", void 0);
            __decorate([
                schema_1.type({ map: "string" })
            ], State.prototype, "stringMap", void 0);
            __decorate([
                schema_1.type({ map: "number" })
            ], State.prototype, "numberMap", void 0);
            __decorate([
                schema_1.type({ map: "boolean" })
            ], State.prototype, "booleanMap", void 0);
            const fun = () => serializer.hasFilter(State._schema, State._filters);
            assert_1.default.doesNotThrow(fun);
            assert_1.default.equal(false, fun());
        });
    });
});
