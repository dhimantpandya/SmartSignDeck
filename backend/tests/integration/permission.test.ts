/* eslint-disable @typescript-eslint/restrict-template-expressions */

import { faker } from "@faker-js/faker";
import httpStatus from "http-status";
import request from "supertest";
import app from "../../src/app";
import { Permission } from "../../src/models";
import {
  insertPermissions,
  permissionOne,
  permissionTwo,
} from "../fixtures/permission.fixture";
import {
  adminAccessToken,
  userOneAccessToken,
} from "../fixtures/token.fixture";
import { admin, insertUsers, userOne, userTwo } from "../fixtures/user.fixture";
import setupTestDB from "../utils/setupTestDB";

setupTestDB();

describe("Permission routes", () => {
  describe("POST /v1/permissions", () => {
    let newPermission: {
      name: string;
      description: string;
      resource: string;
      action: string;
      status: "active";
    };

    beforeEach(() => {
      newPermission = {
        name: userOne._id.toString(),
        description: faker.lorem.sentence(),
        resource: "user",
        action: "create",
        status: "active",
      };
    });

    test("should return 201 and successfully create new permission if data is ok", async () => {
      await insertUsers([admin, userOne, userTwo]);
      // await insertPermissions([permissionOne]);

      const res = await request(app)
        .post("/v1/permissions")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(newPermission)
        .expect(httpStatus.CREATED);

      expect(res.body.data).toMatchObject({
        name: newPermission.name.toUpperCase(),
        description: newPermission.description,
        resource: newPermission.resource,
        action: newPermission.action,
        status: newPermission.status,
        // Add other fields as needed
      });

      const dbPermission = await Permission.findById(res.body.data._id);
      expect(dbPermission).toBeDefined();
      expect(JSON.parse(JSON.stringify(dbPermission))).toMatchObject({
        name: newPermission.name.toUpperCase(),
        description: newPermission.description,
        resource: newPermission.resource,
        action: newPermission.action,
        status: newPermission.status,
        // Add other fields as needed
      });
    });

    test("should return 400 if permission with same name already exists", async () => {
      await insertUsers([admin]);
      await insertPermissions([permissionOne]);

      await request(app)
        .post("/v1/permissions")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(permissionOne)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 401 error if access token is missing", async () => {
      await request(app)
        .post("/v1/permissions")
        .send(newPermission)
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe("GET /v1/permissions", () => {
    test("should return 401 if access token is missing", async () => {
      await request(app)
        .get("/v1/permissions")
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should correctly apply filter on title field", async () => {
      await insertUsers([admin]);
      await insertPermissions([permissionOne, permissionTwo]);

      const res = await request(app)
        .get("/v1/permissions")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .query({ name: permissionOne.name })
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        results: expect.any(Array),
        limit: 10,
        skip: 0,
        totalResults: 1,
      });
      expect(res.body.data.results).toHaveLength(1);
      expect(res.body.data.results[0]._id).toBe(
        permissionOne._id.toHexString(),
      );
    });
  });

  describe("GET /v1/permissions/:permissionId", () => {
    test("should return 200 and the permission object if data is ok", async () => {
      await insertUsers([userOne]);
      await insertPermissions([permissionOne]);
      const res = await request(app)
        .get(`/v1/permissions/${permissionOne._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        _id: permissionOne._id.toHexString(),
        name: permissionOne.name.toUpperCase(),
        description: permissionOne.description,
        resource: permissionOne.resource,
        action: permissionOne.action,
        status: permissionOne.status,
      });
    });

    test("should return 401 error if access token is missing", async () => {
      await insertPermissions([permissionOne]);

      await request(app)
        .get(`/v1/permissions/${permissionOne._id}`)
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 200 and the permission object if admin is trying to get another permission", async () => {
      await insertUsers([admin]);
      await insertPermissions([permissionOne]);

      await request(app)
        .get(`/v1/permissions/${permissionOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);
    });

    test("should return 400 error if permissionId is not a valid mongo id", async () => {
      await insertUsers([admin]);
      await insertPermissions([permissionOne]);

      await request(app)
        .get("/v1/permissions/invalidId")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 404 error if permission is not found", async () => {
      await insertUsers([admin]);

      await request(app)
        .get(`/v1/permissions/${permissionOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe("DELETE /v1/permissions/:permissionId", () => {
    test("should return 204 if data is ok", async () => {
      await insertUsers([userOne]);
      await insertPermissions([permissionOne]);
      await request(app)
        .delete(`/v1/permissions/${permissionOne._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.NO_CONTENT);

      const dbPermission = await Permission.findById(permissionOne._id);
      expect(dbPermission).toBeNull();
    });

    test("should return 401 error if access token is missing", async () => {
      await insertPermissions([permissionOne]);

      await request(app)
        .delete(`/v1/permissions/${permissionOne._id}`)
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 400 error if permissionId is not a valid mongo id", async () => {
      await insertUsers([admin]);
      await request(app)
        .delete("/v1/permissions/invalidId")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 404 error if permission is not found", async () => {
      await insertUsers([admin]);
      await insertPermissions([permissionTwo]);
      await request(app)
        .delete(`/v1/permissions/${permissionOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe("PATCH /v1/permissions/:permissionId", () => {
    test("should return 200 and successfully update permission if data is ok", async () => {
      await insertUsers([userOne]);
      await insertPermissions([permissionOne]);
      const updateBody = {
        name: "Permission-1-updated",
      };
      const res = await request(app)
        .patch(`/v1/permissions/${permissionOne._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);
      expect(res.body.data).toEqual({
        _id: permissionOne._id.toString(),
        name: updateBody.name.toUpperCase(),
        description: permissionOne.description,
        resource: permissionOne.resource,
        action: permissionOne.action,
        status: permissionOne.status,
      });

      const dbPermission = await Permission.findById(permissionOne._id);
      expect(dbPermission).toBeDefined();
      expect(JSON.parse(JSON.stringify(dbPermission))).toMatchObject({
        _id: permissionOne._id.toString(),
        name: updateBody.name.toUpperCase(),
        description: permissionOne.description,
        resource: permissionOne.resource,
        action: permissionOne.action,
        status: permissionOne.status,
      });
    });

    test("should return 401 error if access token is missing", async () => {
      await insertPermissions([permissionOne]);
      const updateBody = { name: faker.person.firstName() };

      await request(app)
        .patch(`/v1/permissions/${permissionOne._id}`)
        .send(updateBody)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 200 and successfully update permission if admin is updating another permission", async () => {
      await insertUsers([admin]);
      await insertPermissions([permissionOne]);
      const updateBody = { name: faker.person.firstName() };

      await request(app)
        .patch(`/v1/permissions/${permissionOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);
    });

    test("should return 400 if permission with same name already exists", async () => {
      await insertUsers([admin]);
      await insertPermissions([permissionOne, permissionTwo]);
      const updateBody = { name: permissionOne.name };

      await request(app)
        .patch(`/v1/permissions/${permissionTwo._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 404 if admin is updating another permission that is not found", async () => {
      await insertUsers([admin]);
      await insertPermissions([permissionOne]);
      const updateBody = { name: faker.person.firstName() };

      await request(app)
        .patch(`/v1/permissions/${permissionTwo._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.NOT_FOUND);
    });

    test("should return 400 error if permissionId is not a valid mongo id", async () => {
      await insertUsers([admin]);
      await insertPermissions([permissionOne]);
      const updateBody = { title: faker.person.firstName() };

      await request(app)
        .patch(`/v1/permissions/invalidId`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 if status is invalid", async () => {
      await insertUsers([admin]);
      await insertPermissions([permissionOne]);
      const updateBody = { status: "test" };

      await request(app)
        .patch(`/v1/permissions/${permissionOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });
  });
});
