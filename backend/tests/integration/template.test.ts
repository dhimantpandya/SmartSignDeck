import request from "supertest";
import httpStatus from "http-status";
import mongoose from "mongoose";
import app from "../../src/app";
import setupTestDB from "../utils/setupTestDB";
import { Template } from "../../src/models";
import { adminRole } from "../fixtures/role.fixture";
import { userOne, admin, insertUsers } from "../fixtures/user.fixture";
import {
  userOneAccessToken,
  adminAccessToken,
} from "../fixtures/token.fixture";
import {
  templateOne,
  templateTwo,
  insertTemplates,
} from "../fixtures/template.fixture";

setupTestDB();

describe("Template routes", () => {
  describe("POST /v1/templates", () => {
    let newTemplate: any;

    beforeEach(() => {
      newTemplate = {
        name: "Test Template",
        resolution: "1920x1080",
        zones: [
          {
            id: "zone-1",
            type: "video",
            x: 0,
            y: 0,
            width: 1920,
            height: 1080,
          },
        ],
      };
    });

    test("should return 201 and successfully create new template if data is ok (Admin)", async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .post("/v1/templates")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(newTemplate)
        .expect(httpStatus.CREATED);

      expect(res.body.data).toEqual({
        id: expect.anything(),
        name: newTemplate.name,
        resolution: newTemplate.resolution,
        zones: expect.any(Array),
        isActive: true,
      });

      const dbTemplate = await Template.findById(res.body.data.id);
      expect(dbTemplate).toBeDefined();
      expect(dbTemplate?.name).toBe(newTemplate.name);
    });

    test("should return 401 error if access token is missing", async () => {
      await request(app)
        .post("/v1/templates")
        .send(newTemplate)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 403 error if user is not admin", async () => {
      await insertUsers([userOne]);

      await request(app)
        .post("/v1/templates")
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(newTemplate)
        .expect(httpStatus.FORBIDDEN);
    });
  });

  describe("GET /v1/templates", () => {
    test("should return 200 and apply the default query options", async () => {
      await insertUsers([admin]);
      await insertTemplates([templateOne, templateTwo]);

      const res = await request(app)
        .get("/v1/templates")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        results: expect.any(Array),
        skip: 0,
        limit: 10,
        totalResults: 2,
      });
      expect(res.body.data.results).toHaveLength(2);
      expect(res.body.data.results[0]).toHaveProperty("id");
    });

    test("should return 401 error if access token is missing", async () => {
      await insertTemplates([templateOne, templateTwo]);

      await request(app)
        .get("/v1/templates")
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 403 error if user is not admin", async () => {
      await insertUsers([userOne]);
      await insertTemplates([templateOne, templateTwo]);

      await request(app)
        .get("/v1/templates")
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });
  });

  describe("GET /v1/templates/:templateId", () => {
    test("should return 200 and the template object if data is ok", async () => {
      await insertUsers([admin]);
      await insertTemplates([templateOne]);

      const res = await request(app)
        .get(`/v1/templates/${templateOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        id: templateOne._id.toHexString(),
        name: templateOne.name,
        resolution: templateOne.resolution,
        zones: expect.any(Array),
        isActive: templateOne.isActive,
      });
    });

    test("should return 401 error if access token is missing", async () => {
      await insertTemplates([templateOne]);

      await request(app)
        .get(`/v1/templates/${templateOne._id}`)
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 403 error if user is not admin", async () => {
      await insertUsers([userOne]);
      await insertTemplates([templateOne]);

      await request(app)
        .get(`/v1/templates/${templateOne._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });

    test("should return 400 error if templateId is not a valid mongo id", async () => {
      await insertUsers([admin]);

      await request(app)
        .get("/v1/templates/invalidId")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 404 error if template is not found", async () => {
      await insertUsers([admin]);

      await request(app)
        .get(`/v1/templates/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe("PATCH /v1/templates/:templateId", () => {
    test("should return 200 and successfully update template if data is ok", async () => {
      await insertUsers([admin]);
      await insertTemplates([templateOne]);
      const updateBody = {
        name: "Updated Name",
      };

      const res = await request(app)
        .patch(`/v1/templates/${templateOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        id: templateOne._id.toHexString(),
        name: updateBody.name,
        resolution: templateOne.resolution,
        zones: expect.any(Array),
        isActive: templateOne.isActive,
      });

      const dbTemplate = await Template.findById(templateOne._id);
      expect(dbTemplate).toBeDefined();
      expect(dbTemplate?.name).toBe(updateBody.name);
    });

    test("should return 401 error if access token is missing", async () => {
      await insertTemplates([templateOne]);
      const updateBody = { name: "Updated Name" };

      await request(app)
        .patch(`/v1/templates/${templateOne._id}`)
        .send(updateBody)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 403 error if user is not admin", async () => {
      await insertUsers([userOne]);
      await insertTemplates([templateOne]);
      const updateBody = { name: "Updated Name" };

      await request(app)
        .patch(`/v1/templates/${templateOne._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.FORBIDDEN);
    });
  });

  describe("DELETE /v1/templates/:templateId", () => {
    test("should return 204 if data is ok", async () => {
      await insertUsers([admin]);
      await insertTemplates([templateOne]);

      await request(app)
        .delete(`/v1/templates/${templateOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NO_CONTENT);

      const dbTemplate = await Template.findById(templateOne._id);
      expect(dbTemplate).toBeNull();
    });

    test("should return 401 error if access token is missing", async () => {
      await insertTemplates([templateOne]);

      await request(app)
        .delete(`/v1/templates/${templateOne._id}`)
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 403 error if user is not admin", async () => {
      await insertUsers([userOne]);
      await insertTemplates([templateOne]);

      await request(app)
        .delete(`/v1/templates/${templateOne._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });
  });
});
