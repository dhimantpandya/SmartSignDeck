/* eslint-disable @typescript-eslint/restrict-template-expressions */

import { faker } from "@faker-js/faker";
import { User } from "../../../src/models";
import { userRole } from "../../fixtures/role.fixture";

describe("User model", () => {
  describe("User validation", () => {
    let newUser: {
      last_name: string;
      first_name: string;
      email: string;
      password: string;
      role: string;
    };
    beforeEach(() => {
      newUser = {
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        password: "password1",
        role: userRole._id.toString(),
      };
    });

    test("should correctly validate a valid user", async () => {
      await expect(new User(newUser).validate()).resolves.toBeUndefined();
    });

    test("should throw a validation error if email is invalid", async () => {
      newUser.email = "invalidEmail";
      await expect(new User(newUser).validate()).rejects.toThrow();
    });

    test("should throw a validation error if password length is less than 8 characters", async () => {
      newUser.password = "password_password";
      await expect(new User(newUser).validate()).rejects.toThrow();
    });

    test("should throw a validation error if password does not contain numbers", async () => {
      newUser.password = "password";
      await expect(new User(newUser).validate()).rejects.toThrow();
    });

    test("should throw a validation error if password does not contain letters", async () => {
      newUser.password = "11111111";
      await expect(new User(newUser).validate()).rejects.toThrow();
    });
  });

  describe("User toJSON()", () => {
    test("should not return user password when toJSON is called", () => {
      const newUser: {
        first_name: string;
        last_name: string;
        email: string;
        password: string;
        role: string;
      } = {
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        password: "password1",
        role: "user",
      };
      expect(new User(newUser).toJSON()).not.toHaveProperty("password");
    });
  });
});
