import request from "supertest";
import httpStatus from "http-status";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import app from "../../src/app";
import { Token } from "../../src/models";
import { tokenTypes } from "../../src/config/tokens";
import setupTestDB from "../utils/setupTestDB";
import { userOne, insertUsers } from "../fixtures/user.fixture";

setupTestDB();

describe("OTP Verification Security Fix", () => {
  describe("POST /v1/auth/verify-otp", () => {
    test("should return 401 if OTP is incorrect", async () => {
      await insertUsers([userOne]);

      // Manually create a verification token in the DB
      const correctOtp = "123456";
      const expires = moment().add(10, "minutes");
      const jti = uuidv4();

      await Token.create({
        jti,
        user: userOne._id,
        type: tokenTypes.VERIFY_EMAIL,
        expires: expires.toDate(),
        otp: correctOtp,
        blacklisted: false,
      });

      // Try to verify with WRONG OTP
      await request(app)
        .post("/v1/auth/verify-otp")
        .send({ email: userOne.email, otp: "000000" })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 200 if OTP is correct", async () => {
      await insertUsers([userOne]);

      const correctOtp = "123456";
      const expires = moment().add(10, "minutes");
      const jti = uuidv4();

      await Token.create({
        jti,
        user: userOne._id,
        type: tokenTypes.VERIFY_EMAIL,
        expires: expires.toDate(),
        otp: correctOtp,
        blacklisted: false,
      });

      // Try to verify with CORRECT OTP
      await request(app)
        .post("/v1/auth/verify-otp")
        .send({ email: userOne.email, otp: correctOtp })
        .expect(httpStatus.OK);
    });
  });
});
