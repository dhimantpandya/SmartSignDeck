import request from "supertest";
import httpStatus from "http-status";
import app from "../../src/app";
import setupTestDB from "../utils/setupTestDB";

setupTestDB();

describe("Health routes", () => {
  describe("GET /v1/health", () => {
    test("should return 200 and health object", async () => {
      const res = await request(app).get("/v1/health").send();

      console.log("HEALTH CHECK RESPONSE:", JSON.stringify(res.body, null, 2));

      expect(res.status).toBe(httpStatus.OK);

      expect(res.body).toHaveProperty("status");
      expect(res.body).toHaveProperty("timestamp");
      expect(res.body).toHaveProperty("uptime");
      expect(res.body).toHaveProperty("environment");
      expect(res.body).toHaveProperty("checks");
      expect(res.body.checks).toHaveProperty("database");
      expect(res.body.checks).toHaveProperty("cloudinary");
      expect(res.body.checks).toHaveProperty("memory");
    });
  });

  describe("GET /v1/health/readiness", () => {
    test("should return 200 and ready: true if DB is connected", async () => {
      const res = await request(app)
        .get("/v1/health/readiness")
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({ ready: true });
    });
  });

  describe("GET /v1/health/liveness", () => {
    test("should return 200 and alive: true", async () => {
      const res = await request(app)
        .get("/v1/health/liveness")
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty("alive", true);
      expect(res.body).toHaveProperty("timestamp");
    });
  });
});
