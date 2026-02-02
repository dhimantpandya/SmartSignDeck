/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { faker } from "@faker-js/faker";
import httpStatus from "http-status";
import request from "supertest";
import app from "../../src/app";
import { User } from "../../src/models";
import { adminRole, userRole } from "../fixtures/role.fixture";
import {
  adminAccessToken,
  userOneAccessToken,
} from "../fixtures/token.fixture";
import { admin, insertUsers, userOne, userTwo } from "../fixtures/user.fixture";
import setupTestDB from "../utils/setupTestDB";

setupTestDB();

describe("User routes", () => {
  describe("POST /v1/users", () => {
    let newUser: {
      first_name: string;
      last_name: string;
      email: string;
      password: string;
      role: string;
    };

    beforeEach(() => {
      newUser = {
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        password: "123123@aA",
        role: userRole._id.toString(),
      };
    });

    test("should return 201 and successfully create new user if data is ok", async () => {
      await insertUsers([admin]);
      const res = await request(app)
        .post("/v1/users")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body.data).not.toHaveProperty("password");
      expect(res.body.data).toEqual({
        _id: expect.anything(),
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        role: userRole._id.toString(),
        is_email_verified: false,
      });

      const dbUser = await User.findById(res.body.data._id);
      expect(dbUser).toBeDefined();
      if (dbUser == null || dbUser === undefined) {
        return;
      }
      expect(dbUser.password).not.toBe(newUser.password);
      expect(JSON.parse(JSON.stringify(dbUser))).toMatchObject({
        _id: dbUser._id.toString(),
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        role: userRole._id.toString(),
        is_email_verified: false,
      });
    });

    test("should be able to create an admin as well", async () => {
      await insertUsers([admin]);
      newUser.role = adminRole._id.toString();
      const res = await request(app)
        .post("/v1/users")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body.data.role).toBe(adminRole._id.toString());

      const dbUser = await User.findById(res.body.data._id);
      expect(dbUser).toBeDefined();
      if (dbUser == null) {
        return;
      }
      expect(dbUser.role.toString()).toBe(adminRole._id.toString());
    });

    test("should return 401 error if access token is missing", async () => {
      await request(app)
        .post("/v1/users")
        .send(newUser)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 403 error if logged in user is not admin", async () => {
      await insertUsers([userOne]);

      await request(app)
        .post("/v1/users")
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(newUser)
        .expect(httpStatus.FORBIDDEN);
    });

    test("should return 400 error if email is invalid", async () => {
      await insertUsers([admin]);
      newUser.email = "invalidEmail";

      await request(app)
        .post("/v1/users")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 error if email is already used", async () => {
      await insertUsers([admin, userOne]);
      newUser.email = userOne.email;

      await request(app)
        .post("/v1/users")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 error if password length is less than 8 characters", async () => {
      await insertUsers([admin]);
      newUser.password = "passwo1";

      await request(app)
        .post("/v1/users")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 error if password does not contain both letters and numbers", async () => {
      await insertUsers([admin]);
      newUser.password = "password";
      await request(app)
        .post("/v1/users")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);

      newUser.password = "1111111";

      await request(app)
        .post("/v1/users")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 error if role is neither user nor admin", async () => {
      await insertUsers([admin]);
      newUser.role = "invalid";

      await request(app)
        .post("/v1/users")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe("GET /v1/users", () => {
    test("should return 200 and apply the default query options", async () => {
      await insertUsers([userOne, userTwo, admin]);

      const res = await request(app)
        .get("/v1/users")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        results: expect.any(Array),
        limit: 10,
        skip: 0,
        totalResults: 3,
      });
      expect(res.body.data.results).toHaveLength(3);
      expect(res.body.data.results[0]).toEqual({
        _id: userOne._id.toHexString(),
        first_name: userOne.first_name,
        last_name: userOne.last_name,
        email: userOne.email,
        role: userOne.role.toString(),
        is_email_verified: userOne.is_email_verified,
      });
    });

    test("should return 401 if access token is missing", async () => {
      await insertUsers([userOne, userTwo, admin]);

      await request(app)
        .get("/v1/users")
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 403 if a non-admin is trying to access all users", async () => {
      await insertUsers([userOne, userTwo, admin]);

      await request(app)
        .get("/v1/users")
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });

    test("should correctly apply filter on first_name field", async () => {
      await insertUsers([userOne, userTwo, admin]);

      const res = await request(app)
        .get("/v1/users")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .query({ first_name: userOne.first_name })
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        results: expect.any(Array),
        limit: 10,
        skip: 0,
        totalResults: 1,
      });
      expect(res.body.data.results).toHaveLength(1);
      expect(res.body.data.results[0]._id).toBe(userOne._id.toHexString());
    });

    test("should correctly apply filter on role field", async () => {
      await insertUsers([userOne, userTwo, admin]);

      const res = await request(app)
        .get("/v1/users")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .query({ role: userRole._id.toString() })
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        results: expect.any(Array),
        limit: 10,
        skip: 0,
        totalResults: 2,
      });

      expect(res.body.data.results).toHaveLength(2);
      expect(res.body.data.results[0]._id).toBe(userOne._id.toHexString());
      expect(res.body.data.results[1]._id).toBe(userTwo._id.toHexString());
    });

    test("should correctly sort the returned array if descending sort param is specified", async () => {
      await insertUsers([
        { ...userOne, ...{ first_name: "Alan" } },
        { ...userTwo, ...{ first_name: "Brian" } },
        { ...admin, ...{ first_name: "Cross" } },
      ]);

      const res = await request(app)
        .get("/v1/users?sort=-first_name")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        results: expect.any(Array),
        limit: 10,
        skip: 0,
        totalResults: 3,
      });
      expect(res.body.data.results).toHaveLength(3);
      expect(res.body.data.results[0]._id).toBe(admin._id.toHexString());
      expect(res.body.data.results[1]._id).toBe(userTwo._id.toHexString());
      expect(res.body.data.results[2]._id).toBe(userOne._id.toHexString());
    });

    test("should correctly sort the returned array if ascending sort param is specified", async () => {
      await insertUsers([
        { ...userOne, ...{ first_name: "Alan" } },
        { ...userTwo, ...{ first_name: "Brian" } },
        { ...admin, ...{ first_name: "Cross" } },
      ]);

      const res = await request(app)
        .get("/v1/users?sort=first_name")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        results: expect.any(Array),
        limit: 10,
        skip: 0,
        totalResults: 3,
      });
      expect(res.body.data.results).toHaveLength(3);
      expect(res.body.data.results[0]._id).toBe(userOne._id.toHexString());
      expect(res.body.data.results[1]._id).toBe(userTwo._id.toHexString());
      expect(res.body.data.results[2]._id).toBe(admin._id.toHexString());
    });

    test("should correctly sort the returned array if multiple sorting criteria are specified", async () => {
      await insertUsers([userOne, userTwo, admin]);

      const res = await request(app)
        .get("/v1/users?sort=-role,first_name")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        results: expect.any(Array),
        limit: 10,
        skip: 0,
        totalResults: 3,
      });
      expect(res.body.data.results).toHaveLength(3);

      const expectedOrder = [userOne, userTwo, admin].sort((a, b) => {
        if (a.role < b.role) {
          return 1;
        }
        if (a.role > b.role) {
          return -1;
        }
        return a.first_name < b.first_name ? -1 : 1;
      });

      expectedOrder.forEach((user, index) => {
        expect(res.body.data.results[index]._id).toBe(user._id.toHexString());
      });
    });

    test("should limit returned array if limit param is specified", async () => {
      await insertUsers([userOne, userTwo, admin]);

      const res = await request(app)
        .get("/v1/users?limit=2")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        results: expect.any(Array),
        limit: 2,
        skip: 0,
        totalResults: 3,
      });
      expect(res.body.data.results).toHaveLength(2);
      expect(res.body.data.results[0]._id).toBe(userOne._id.toHexString());
      expect(res.body.data.results[1]._id).toBe(userTwo._id.toHexString());
    });

    test("should return the correct page if page and limit params are specified", async () => {
      await insertUsers([userOne, userTwo, admin]);

      const res = await request(app)
        .get("/v1/users?limit=2&skip=2")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        results: expect.any(Array),
        limit: 2,
        skip: 2,
        totalResults: 3,
      });
      expect(res.body.data.results).toHaveLength(1);
      expect(res.body.data.results[0]._id).toBe(admin._id.toHexString());
    });
  });

  describe("GET /v1/users/:userId", () => {
    test("should return 200 and the user object if data is ok", async () => {
      await insertUsers([userOne]);

      const res = await request(app)
        .get(`/v1/users/${userOne._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).not.toHaveProperty("password");
      expect(res.body.data).toEqual({
        _id: userOne._id.toHexString(),
        email: userOne.email,
        first_name: userOne.first_name,
        last_name: userOne.last_name,
        role: userOne.role.toString(),
        is_email_verified: userOne.is_email_verified,
      });
    });

    test("should return 401 error if access token is missing", async () => {
      await insertUsers([userOne]);

      await request(app)
        .get(`/v1/users/${userOne._id}`)
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 403 error if user is trying to get another user", async () => {
      await insertUsers([userOne, userTwo]);

      await request(app)
        .get(`/v1/users/${userTwo._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });

    test("should return 200 and the user object if admin is trying to get another user", async () => {
      await insertUsers([userOne, admin]);

      await request(app)
        .get(`/v1/users/${userOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);
    });

    test("should return 400 error if userId is not a valid mongo id", async () => {
      await insertUsers([admin]);

      await request(app)
        .get("/v1/users/invalidId")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 404 error if user is not found", async () => {
      await insertUsers([admin]);

      await request(app)
        .get(`/v1/users/${userOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe("DELETE /v1/users/:userId", () => {
    test("should return 204 if data is ok", async () => {
      await insertUsers([userOne]);
      await request(app)
        .delete(`/v1/users/${userOne._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.NO_CONTENT);

      const dbUser = await User.findById(userOne._id);
      expect(dbUser).toBeNull();
    });

    test("should return 401 error if access token is missing", async () => {
      await insertUsers([userOne]);

      await request(app)
        .delete(`/v1/users/${userOne._id}`)
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 404 error if user is trying to delete another user", async () => {
      await insertUsers([userOne, userTwo]);

      await request(app)
        .delete(`/v1/users/${userTwo._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });

    test("should return 204 if admin is trying to delete another user", async () => {
      await insertUsers([userOne, admin]);

      await request(app)
        .delete(`/v1/users/${userOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NO_CONTENT);
    });

    test("should return 400 error if userId is not a valid mongo id", async () => {
      await insertUsers([admin]);

      await request(app)
        .delete("/v1/users/invalidId")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 404 error if user already is not found", async () => {
      await insertUsers([admin]);

      await request(app)
        .delete(`/v1/users/${userOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe("PATCH /v1/users/:userId", () => {
    test("should return 200 and successfully update user if data is ok", async () => {
      await insertUsers([userOne]);
      const updateBody = {
        first_name: faker.person.firstName(),
        email: faker.internet.email().toLowerCase(),
        password: "newPassword$1",
      };

      const res = await request(app)
        .patch(`/v1/users/${userOne._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        _id: userOne._id.toHexString(),
        first_name: updateBody.first_name,
        last_name: userOne.last_name,
        email: updateBody.email,
        role: userRole._id.toString(),
        is_email_verified: false,
      });

      const dbUser = await User.findById(userOne._id);
      expect(dbUser).toBeDefined();
      if (dbUser == null) {
        return;
      }

      expect(dbUser).toMatchObject({
        _id: userOne._id,
        first_name: updateBody.first_name,
        last_name: userOne.last_name,
        email: updateBody.email,
        role: userRole._id,
        is_email_verified: false,
      });
    });

    test("should return 401 error if access token is missing", async () => {
      await insertUsers([userOne]);
      const updateBody = { first_name: faker.person.firstName() };

      await request(app)
        .patch(`/v1/users/${userOne._id}`)
        .send(updateBody)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 403 if user is updating another user", async () => {
      await insertUsers([userOne, userTwo]);
      const updateBody = { first_name: faker.person.firstName() };

      await request(app)
        .patch(`/v1/users/${userTwo._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.NOT_FOUND);
    });

    test("should return 200 and successfully update user if admin is updating another user", async () => {
      await insertUsers([userOne, admin]);
      const updateBody = { first_name: faker.person.firstName() };

      await request(app)
        .patch(`/v1/users/${userOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);
    });

    test("should return 404 if admin is updating another user that is not found", async () => {
      await insertUsers([admin]);
      const updateBody = { first_name: faker.person.firstName() };

      await request(app)
        .patch(`/v1/users/${userOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.NOT_FOUND);
    });

    test("should return 400 error if userId is not a valid mongo id", async () => {
      await insertUsers([admin]);
      const updateBody = { first_name: faker.person.firstName() };

      await request(app)
        .patch(`/v1/users/invalidId`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 if email is invalid", async () => {
      await insertUsers([userOne]);
      const updateBody = { email: "invalidEmail" };

      await request(app)
        .patch(`/v1/users/${userOne._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 if email is already taken", async () => {
      await insertUsers([userOne, userTwo]);
      const updateBody = { email: userTwo.email };

      await request(app)
        .patch(`/v1/users/${userOne._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should not return 400 if email is my email", async () => {
      await insertUsers([userOne]);
      const updateBody = { email: userOne.email };

      await request(app)
        .patch(`/v1/users/${userOne._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);
    });

    test("should return 400 if password length is less than 8 characters", async () => {
      await insertUsers([userOne]);
      const updateBody = { password: "passwo1" };

      await request(app)
        .patch(`/v1/users/${userOne._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 if password does not contain both letters and numbers", async () => {
      await insertUsers([userOne]);
      const updateBody = { password: "password" };

      await request(app)
        .patch(`/v1/users/${userOne._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);

      updateBody.password = "11111111";

      await request(app)
        .patch(`/v1/users/${userOne._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });
  });
});
