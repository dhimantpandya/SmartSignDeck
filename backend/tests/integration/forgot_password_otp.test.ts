import request from "supertest";
import httpStatus from "http-status";
import moment from "moment";
import app from "../../src/app";
import { User, Token } from "../../src/models";
import { tokenTypes } from "../../src/config/tokens";
import setupTestDB from "../utils/setupTestDB";
import { userOne, insertUsers } from "../fixtures/user.fixture";
import { emailService } from "../../src/services";

setupTestDB();

describe("Forgot Password OTP Flow", () => {
  describe("POST /v1/auth/verify-reset-otp", () => {
    test("should return 200 and a reset token if OTP is valid", async () => {
      await insertUsers([userOne]);

      // 1. Submit Forgot Password Request
      jest.spyOn(emailService.transport, "sendMail").mockResolvedValue({});
      await request(app)
        .post("/v1/auth/forgot-password")
        .send({ email: userOne.email })
        .expect(httpStatus.OK);

      // 2. Fetch the OTP from the database
      const tokenDoc = await Token.findOne({
        user: userOne._id,
        type: tokenTypes.RESET_PASSWORD,
      });
      expect(tokenDoc).toBeDefined();
      expect(tokenDoc?.otp).toBeDefined();
      const otp = tokenDoc!.otp!;

      // 3. Verify OTP
      const res = await request(app)
        .post("/v1/auth/verify-reset-otp")
        .send({ email: userOne.email, otp })
        .expect(httpStatus.OK);

      // Check response structure
      expect(res.body).toHaveProperty("data.token");
      const resetToken = res.body.data.token;
      expect(resetToken).toBeDefined();

      // 4. Reset Password using the token
      const newPassword = "NewPassword1!";
      await request(app)
        .post("/v1/auth/reset-password")
        .send({ token: resetToken, password: newPassword })
        .expect(httpStatus.OK);

      // 5. Verify login with new password
      await request(app)
        .post("/v1/auth/login")
        .send({ email: userOne.email, password: newPassword })
        .expect(httpStatus.OK);
    });

    test("should return 401 if OTP is invalid", async () => {
      await insertUsers([userOne]);

      // 1. Submit Forgot Password Request to generate OTP
      await request(app)
        .post("/v1/auth/forgot-password")
        .send({ email: userOne.email })
        .expect(httpStatus.OK);

      // 2. Try with wrong OTP
      await request(app)
        .post("/v1/auth/verify-reset-otp")
        .send({ email: userOne.email, otp: "000000" })
        .expect(httpStatus.UNAUTHORIZED);
    });
  });
});
