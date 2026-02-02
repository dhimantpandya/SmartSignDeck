/* eslint-disable @typescript-eslint/restrict-template-expressions */

import { faker } from "@faker-js/faker";
import httpStatus from "http-status";
import mongoose, { type Types } from "mongoose";
import request from "supertest";
import app from "../../src/app";
import { Role } from "../../src/models";
import { insertRoles, roleOne, roleTwo } from "../fixtures/role.fixture";
import { adminAccessToken } from "../fixtures/token.fixture";
import { admin, insertUsers } from "../fixtures/user.fixture";
import setupTestDB from "../utils/setupTestDB";

setupTestDB();

describe("Role routes", () => {
  describe("POST /v1/roles", () => {
    let newRole: {
      name: string;
      description: string;
      permissions: Types.ObjectId[];
      status: string;
    };

    beforeEach(() => {
      newRole = {
        name: "test",
        description: "test role",
        permissions: [
          new mongoose.Types.ObjectId("649d1965a463deeed0fa45a2"),
          new mongoose.Types.ObjectId("649d1965a463deeed0fa45a1"),
          new mongoose.Types.ObjectId("649d1965a463deeed0fb45a0"),
          new mongoose.Types.ObjectId("649d1965a463deeed0fb45a1"),
          new mongoose.Types.ObjectId("649d1965a463deeed0fb45a2"),
          new mongoose.Types.ObjectId("649d1965a463deeed0fb45a3"),
          new mongoose.Types.ObjectId("649d1965a463deeed0fa45a4"),
          new mongoose.Types.ObjectId("649d1965a463deeed0fb45a4"),
          new mongoose.Types.ObjectId("659532f24d77305e954d71b5"),
          new mongoose.Types.ObjectId("659532f880991cabd413743f"),
          new mongoose.Types.ObjectId("659532fca81b18d63875ef4a"),
          new mongoose.Types.ObjectId("659532ffd9a9c2d82bc12c7e"),
          new mongoose.Types.ObjectId("659533034c75d93cba864737"),
          new mongoose.Types.ObjectId("33e58810ac3736fad6b153e3"),
          new mongoose.Types.ObjectId("5b4b3bd130e6fa0df44591d0"),
          new mongoose.Types.ObjectId("e802b8f3142593c5ad7355a3"),
          new mongoose.Types.ObjectId("32ef5e30b691fd1479bb263e"),
          new mongoose.Types.ObjectId("2c5d73b4d8a7dd042646ca14"),
        ],
        status: "active",
      };
    });

    test("should return 201 and successfully create new role if data is ok", async () => {
      await insertUsers([admin]);
      await insertRoles([roleOne]);

      const res = await request(app)
        .post("/v1/roles")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(newRole)
        .expect(httpStatus.CREATED);

      expect(res.body.data).toMatchObject({
        name: newRole.name.toUpperCase(),
        description: newRole.description,
        permissions: newRole.permissions.map((id) => id.toHexString()),
        status: newRole.status,
        // Add other fields as needed
      });

      const dbRole = await Role.findById(res.body.data._id);
      expect(dbRole).toBeDefined();
      expect(JSON.parse(JSON.stringify(dbRole))).toMatchObject({
        name: newRole.name.toUpperCase(),
        description: newRole.description,
        permissions: newRole.permissions.map((id) => id.toHexString()),
        status: newRole.status,
        // Add other fields as needed
      });
    });

    test("should return 400 and successfully create new role if data is ok", async () => {
      await insertUsers([admin]);
      await insertRoles([roleOne]);

      await request(app)
        .post("/v1/roles")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(roleOne)
        .expect(httpStatus.BAD_REQUEST);
    });
    test("should return 401 error if access token is missing", async () => {
      await request(app)
        .post("/v1/roles")
        .send(newRole)
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe("GET /v1/roles", () => {
    test("should return 401 if access token is missing", async () => {
      await request(app)
        .get("/v1/roles")
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should correctly apply filter on name field", async () => {
      await insertUsers([admin]);
      const rolesToBeInserted = [roleOne, roleTwo];
      await insertRoles(rolesToBeInserted);

      const res = await request(app)
        .get("/v1/roles")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .query({ name: roleOne.name })
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        results: expect.any(Array),
        limit: 10,
        skip: 0,
        totalResults: 1,
      });
      expect(res.body.data.results).toHaveLength(1);
      expect(res.body.data.results[0]._id).toBe(roleOne._id.toHexString());
    });
  });

  describe("GET /v1/roles/:roleId", () => {
    test("should return 200 and the role object if data is ok", async () => {
      await insertUsers([admin]);
      await insertRoles([roleOne]);

      const res = await request(app)
        .get(`/v1/roles/${roleOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        _id: roleOne._id.toHexString(),
        name: roleOne.name.toUpperCase(),
        description: roleOne.description,
        permissions: roleOne.permissions.map((id) => id.toHexString()),
        status: roleOne.status,
      });
    });

    test("should return 401 error if access token is missing", async () => {
      await insertRoles([roleOne]);

      await request(app)
        .get(`/v1/roles/${roleOne._id}`)
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 200 and the role object if admin is trying to get another role", async () => {
      await insertUsers([admin]);
      await insertRoles([roleOne]);

      await request(app)
        .get(`/v1/roles/${roleOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);
    });

    test("should return 400 error if roleId is not a valid mongo id", async () => {
      await insertUsers([admin]);
      await insertRoles([roleOne]);

      await request(app)
        .get("/v1/roles/invalidId")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 404 error if role is not found", async () => {
      await insertUsers([admin]);

      await request(app)
        .get(`/v1/roles/${roleOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe("DELETE /v1/roles/:roleId", () => {
    test("should return 204 if data is ok", async () => {
      await insertUsers([admin]);
      await insertRoles([roleOne]);
      await request(app)
        .delete(`/v1/roles/${roleOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NO_CONTENT);

      const dbRole = await Role.findById(roleOne._id);
      expect(dbRole).toBeNull();
    });

    test("should return 401 error if access token is missing", async () => {
      await insertRoles([roleOne]);

      await request(app)
        .delete(`/v1/roles/${roleOne._id}`)
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 204 if admin is trying to delete another role", async () => {
      await insertUsers([admin]);
      await insertRoles([roleOne]);

      await request(app)
        .delete(`/v1/roles/${roleOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NO_CONTENT);
    });

    test("should return 400 error if roleId is not a valid mongo id", async () => {
      await insertUsers([admin]);
      await request(app)
        .delete("/v1/roles/invalidId")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 404 error if role already is not found", async () => {
      await insertUsers([admin]);
      await insertRoles([roleTwo]);
      await request(app)
        .delete(`/v1/roles/${roleOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe("PATCH /v1/roles/:roleId", () => {
    test("should return 200 and successfully update role if data is ok", async () => {
      await insertUsers([admin]);
      await insertRoles([roleOne]);
      const updateBody = {
        name: "Role-1-updated",
      };
      const res = await request(app)
        .patch(`/v1/roles/${roleOne._id.toString()}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);
      expect(res.body.data).toEqual({
        _id: roleOne._id.toString(),
        name: updateBody.name.toUpperCase(),
        description: roleOne.description,
        permissions: roleOne.permissions.map((id) => id.toHexString()),
        status: roleOne.status,
      });

      const dbRole = await Role.findById(roleOne._id);
      expect(dbRole).toBeDefined();
      expect(JSON.parse(JSON.stringify(dbRole))).toMatchObject({
        _id: roleOne._id.toString(),
        name: updateBody.name.toUpperCase(),
        description: roleOne.description,
        permissions: roleOne.permissions.map((id) => id.toHexString()),
        status: roleOne.status,
      });
    });

    test("should return 400 if role with same name already exists", async () => {
      await insertUsers([admin]);
      await insertRoles([roleOne, roleTwo]);
      const updateBody = {
        name: "role-1",
      };
      await request(app)
        .patch(`/v1/roles/${roleTwo._id.toString()}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 401 error if access token is missing", async () => {
      await insertRoles([roleOne]);
      const updateBody = { name: faker.person.firstName() };

      await request(app)
        .patch(`/v1/roles/${roleOne._id}`)
        .send(updateBody)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 200 and successfully update role if admin is updating another role", async () => {
      await insertUsers([admin]);
      await insertRoles([roleOne]);
      const updateBody = { name: faker.person.firstName() };

      await request(app)
        .patch(`/v1/roles/${roleOne._id.toString()}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);
    });

    test("should return 404 if admin is updating another role that is not found", async () => {
      await insertUsers([admin]);
      await insertRoles([roleOne]);
      const updateBody = { name: faker.person.firstName() };

      await request(app)
        .patch(`/v1/roles/${roleTwo._id.toString()}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.NOT_FOUND);
    });

    test("should return 400 error if roleId is not a valid mongo id", async () => {
      await insertUsers([admin]);
      await insertRoles([roleOne]);
      const updateBody = { title: faker.person.firstName() };

      await request(app)
        .patch(`/v1/roles/invalidId`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 if userId is invalid", async () => {
      await insertUsers([admin]);
      await insertRoles([roleOne]);
      const updateBody = { permissions: ["test"] };

      await request(app)
        .patch(`/v1/roles/${roleOne._id.toString()}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });
  });
});
