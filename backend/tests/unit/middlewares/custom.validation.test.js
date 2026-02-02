"use strict";
/* eslint-disable @typescript-eslint/restrict-template-expressions */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const custom_validation_1 = require("../../../src/validations/custom.validation");
describe('CUSTOM VALIDATION: Password Validation', () => {
    const schema = joi_1.default.string().custom(custom_validation_1.password, 'custom password validation');
    test('should validate a valid password', () => {
        const result = schema.validate('Password@123');
        expect(result.error).toBeUndefined();
    });
    test('should fail for password less than 8 characters', () => {
        var _a;
        const result = schema.validate('Pass12!');
        expect(result.error).toBeDefined();
        if (result.error !== null) {
            expect((_a = result.error) === null || _a === void 0 ? void 0 : _a.details[0].message).toEqual('"value" failed custom validation because password must be between 8 and 16 characters');
        }
    });
    test('should fail for password without a number', () => {
        var _a;
        const result = schema.validate('Password');
        expect(result.error).toBeDefined();
        if (result.error !== null) {
            expect((_a = result === null || result === void 0 ? void 0 : result.error) === null || _a === void 0 ? void 0 : _a.details[0].message).toEqual('"value" failed custom validation because password must contain at least 1 digit');
        }
    });
    test('should fail for password without a letter', () => {
        var _a;
        const result = schema.validate('12345678');
        expect(result.error).toBeDefined();
        expect((_a = result.error) === null || _a === void 0 ? void 0 : _a.details[0].message).toEqual('"value" failed custom validation because password must contain at least 1 lowercase letter');
    });
});
describe('CUSTOM VALIDATION: ObjectId Validation', () => {
    const schema = joi_1.default.string().custom(custom_validation_1.objectId, 'custom objectId validation');
    test('should validate a valid objectId', () => {
        const result = schema.validate('507f1f77bcf86cd799439011');
        expect(result.error).toBeUndefined();
    });
    test('should fail for objectId less than 24 characters', () => {
        var _a;
        const result = schema.validate('507f1f77bcf86cd79943');
        expect(result.error).toBeDefined();
        expect((_a = result === null || result === void 0 ? void 0 : result.error) === null || _a === void 0 ? void 0 : _a.details[0].message).toEqual('"value" failed custom validation because "507f1f77bcf86cd79943" must be a valid mongo id');
    });
    test('should fail for objectId with non-hexadecimal characters', () => {
        var _a;
        const result = schema.validate('507f1f77bcf86cd79943901Z');
        expect(result.error).toBeDefined();
        expect((_a = result.error) === null || _a === void 0 ? void 0 : _a.details[0].message).toEqual('"value" failed custom validation because "507f1f77bcf86cd79943901Z" must be a valid mongo id');
    });
});
