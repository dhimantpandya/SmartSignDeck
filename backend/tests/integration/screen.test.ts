import request from "supertest";
import httpStatus from "http-status";
import mongoose from "mongoose";
import app from "../../src/app";
import setupTestDB from "../utils/setupTestDB";
import { Screen } from "../../src/models";
import { userOne, admin, insertUsers } from "../fixtures/user.fixture";
import {
  userOneAccessToken,
  adminAccessToken,
} from "../fixtures/token.fixture";
import { templateOne, insertTemplates } from "../fixtures/template.fixture";
import {
  screenOne,
  screenTwo,
  insertScreens,
} from "../fixtures/screen.fixture";

setupTestDB();

describe("Screen routes", () => {
  describe("POST /v1/screens", () => {
    let newScreen: any;

    beforeEach(() => {
      newScreen = {
        name: "Screen 1",
        templateId: templateOne._id,
        defaultContent: {
          "zone-1": {
            type: "video",
            playlist: [
              {
                url: "http://example.com/video.mp4",
                duration: 10,
                type: "video",
              },
            ],
          },
        },
      };
    });

    test("should return 201 and successfully create new screen if data is ok (Admin)", async () => {
      await insertUsers([admin]);
      await insertTemplates([templateOne]);

      const res = await request(app)
        .post("/v1/screens")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(newScreen);

      expect(res.status).toBe(httpStatus.CREATED);

      expect(res.body.data).toEqual({
        id: expect.anything(),
        name: newScreen.name,
        templateId: newScreen.templateId.toHexString(),
        defaultContent: newScreen.defaultContent,
        status: "offline",
        schedules: [],
      });

      const dbScreen = await Screen.findById(res.body.data.id);
      expect(dbScreen).toBeDefined();
      expect(dbScreen?.name).toBe(newScreen.name);
    });

    test("should return 401 error if access token is missing", async () => {
      await request(app)
        .post("/v1/screens")
        .send(newScreen)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 403 error if user is not admin", async () => {
      await insertUsers([userOne]);

      await request(app)
        .post("/v1/screens")
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(newScreen)
        .expect(httpStatus.FORBIDDEN);
    });
  });

  describe("GET /v1/screens", () => {
    test("should return 200 and apply the default query options", async () => {
      await insertUsers([admin]);
      await insertTemplates([templateOne]);
      await insertScreens([screenOne, screenTwo]);

      const res = await request(app)
        .get("/v1/screens")
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
      expect(res.body.data.results[0].templateId).toHaveProperty("id");
    });

    test("should return 401 error if access token is missing", async () => {
      await request(app)
        .get("/v1/screens")
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe("GET /v1/screens/:screenId", () => {
    test("should return 200 and the screen object if data is ok", async () => {
      await insertUsers([admin]);
      await insertTemplates([templateOne]);
      await insertScreens([screenOne]);

      const res = await request(app)
        .get(`/v1/screens/${screenOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        id: screenOne._id.toHexString(),
        name: screenOne.name,
        templateId: expect.objectContaining({
          id: screenOne.templateId.toHexString(),
        }),
        status: screenOne.status,
        lastPing: expect.anything(),
        schedules: [],
      });
    });

    test("should return 404 error if screen is not found", async () => {
      await insertUsers([admin]);

      await request(app)
        .get(`/v1/screens/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe("PATCH /v1/screens/:screenId", () => {
    test("should return 200 and successfully update screen if data is ok", async () => {
      await insertUsers([admin]);
      await insertTemplates([templateOne]);
      await insertScreens([screenOne]);
      const updateBody = {
        name: "Updated Screen Name",
      };

      const res = await request(app)
        .patch(`/v1/screens/${screenOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body.data.name).toBe(updateBody.name);

      const dbScreen = await Screen.findById(screenOne._id);
      expect(dbScreen?.name).toBe(updateBody.name);
    });
  });

  describe("DELETE /v1/screens/:screenId", () => {
    test("should return 204 if data is ok", async () => {
      await insertUsers([admin]);
      await insertTemplates([templateOne]);
      await insertScreens([screenOne]);

      await request(app)
        .delete(`/v1/screens/${screenOne._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NO_CONTENT);

      const dbScreen = await Screen.findById(screenOne._id);
      expect(dbScreen).toBeNull();
    });
  });

  describe("POST /v1/screens/:screenId/ping", () => {
    test("should return 200 and update lastPing and status to online", async () => {
      await insertTemplates([templateOne]);
      await insertScreens([screenOne]);

      const res = await request(app)
        .post(`/v1/screens/${screenOne._id}/ping`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body.data.status).toBe("online");
      expect(new Date(res.body.data.lastPing).getTime()).toBeGreaterThan(
        new Date(screenOne.lastPing).getTime(),
      );
    });
  });
});
