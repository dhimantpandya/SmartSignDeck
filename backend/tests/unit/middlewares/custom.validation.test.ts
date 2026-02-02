/* eslint-disable @typescript-eslint/restrict-template-expressions */

import Joi from "joi";
import { password, objectId } from "../../../src/validations/custom.validation";

describe("CUSTOM VALIDATION: Password Validation", () => {
  const schema = Joi.string().custom(password, "custom password validation");

  test("should validate a valid password", () => {
    const result = schema.validate("Password@123");
    expect(result.error).toBeUndefined();
  });

  test("should fail for password less than 8 characters", () => {
    const result = schema.validate("Pass12!");
    expect(result.error).toBeDefined();
    if (result.error !== null) {
      expect(result.error?.details[0].message).toEqual(
        '"value" failed custom validation because password must be between 8 and 16 characters',
      );
    }
  });

  test("should fail for password without a number", () => {
    const result = schema.validate("Password");
    expect(result.error).toBeDefined();
    if (result.error !== null) {
      expect(result?.error?.details[0].message).toEqual(
        '"value" failed custom validation because password must contain at least 1 digit',
      );
    }
  });

  test("should fail for password without a letter", () => {
    const result = schema.validate("12345678");
    expect(result.error).toBeDefined();
    expect(result.error?.details[0].message).toEqual(
      '"value" failed custom validation because password must contain at least 1 lowercase letter',
    );
  });
});

describe("CUSTOM VALIDATION: ObjectId Validation", () => {
  const schema = Joi.string().custom(objectId, "custom objectId validation");

  test("should validate a valid objectId", () => {
    const result = schema.validate("507f1f77bcf86cd799439011");
    expect(result.error).toBeUndefined();
  });

  test("should fail for objectId less than 24 characters", () => {
    const result = schema.validate("507f1f77bcf86cd79943");
    expect(result.error).toBeDefined();
    expect(result?.error?.details[0].message).toEqual(
      '"value" failed custom validation because "507f1f77bcf86cd79943" must be a valid mongo id',
    );
  });

  test("should fail for objectId with non-hexadecimal characters", () => {
    const result = schema.validate("507f1f77bcf86cd79943901Z");
    expect(result.error).toBeDefined();
    expect(result.error?.details[0].message).toEqual(
      '"value" failed custom validation because "507f1f77bcf86cd79943901Z" must be a valid mongo id',
    );
  });
});
