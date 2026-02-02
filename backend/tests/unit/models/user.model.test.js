"use strict";
/* eslint-disable @typescript-eslint/restrict-template-expressions */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const faker_1 = require("@faker-js/faker");
const models_1 = require("../../../src/models");
const role_fixture_1 = require("../../fixtures/role.fixture");
describe('User model', () => {
    describe('User validation', () => {
        let newUser;
        beforeEach(() => {
            newUser = {
                first_name: faker_1.faker.person.firstName(),
                last_name: faker_1.faker.person.lastName(),
                email: faker_1.faker.internet.email().toLowerCase(),
                password: 'password1',
                role: role_fixture_1.userRole._id.toString(),
            };
        });
        test('should correctly validate a valid user', () => __awaiter(void 0, void 0, void 0, function* () {
            yield expect(new models_1.User(newUser).validate()).resolves.toBeUndefined();
        }));
        test('should throw a validation error if email is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
            newUser.email = 'invalidEmail';
            yield expect(new models_1.User(newUser).validate()).rejects.toThrow();
        }));
        test('should throw a validation error if password length is less than 8 characters', () => __awaiter(void 0, void 0, void 0, function* () {
            newUser.password = 'password_password';
            yield expect(new models_1.User(newUser).validate()).rejects.toThrow();
        }));
        test('should throw a validation error if password does not contain numbers', () => __awaiter(void 0, void 0, void 0, function* () {
            newUser.password = 'password';
            yield expect(new models_1.User(newUser).validate()).rejects.toThrow();
        }));
        test('should throw a validation error if password does not contain letters', () => __awaiter(void 0, void 0, void 0, function* () {
            newUser.password = '11111111';
            yield expect(new models_1.User(newUser).validate()).rejects.toThrow();
        }));
    });
    describe('User toJSON()', () => {
        test('should not return user password when toJSON is called', () => {
            const newUser = {
                first_name: faker_1.faker.person.firstName(),
                last_name: faker_1.faker.person.lastName(),
                email: faker_1.faker.internet.email().toLowerCase(),
                password: 'password1',
                role: 'user',
            };
            expect(new models_1.User(newUser).toJSON()).not.toHaveProperty('password');
        });
    });
});
