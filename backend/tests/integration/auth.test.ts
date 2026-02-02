/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import moment from "moment";
import httpMocks from "node-mocks-http";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";
import app from "../../src/app";
import config from "../../src/config/config";
import { tokenTypes } from "../../src/config/tokens";
import auth from "../../src/middleware/auth";
import { Role, Token, User } from "../../src/models";
import { emailService, tokenService } from "../../src/services";
import ApiError from "../../src/utils/ApiError";
import * as emailConstants from "../../src/utils/constants/email.constants";
import { insertRoles, userRole } from "../fixtures/role.fixture";
import { userOneAccessToken } from "../fixtures/token.fixture";
import { insertUsers, userOne } from "../fixtures/user.fixture";
import setupTestDB from "../utils/setupTestDB";

setupTestDB();

describe("Auth routes", () => {
  describe("POST /v1/auth/register", () => {
    let newUser: {
      first_name: string;
      last_name: string;
      email: string;
      password: string;
    };
    beforeEach(() => {
      newUser = {
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        password: "123123@aA",
      };
    });

    test("should return 201 and successfully register user if request data is ok", async () => {
      const userRoleData = await Role.findOne({ name: "user" }).lean();
      if (userRoleData == null) {
        await insertRoles([userRole]);
      }
      const res = await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.CREATED);
      expect(res.body.data.user).not.toHaveProperty("password");
      expect(res.body.data.user).toEqual({
        _id: expect.anything(),
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        role: "user",
        is_email_verified: false,
      });

      const dbUser = await User.findById(res.body.data.user._id).lean();
      expect(dbUser).toBeDefined();
      expect(dbUser?.password).not.toBe(newUser.password);
      expect(dbUser).toMatchObject({
        _id: dbUser?._id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        role: "user",
        is_email_verified: false,
      });

      expect(res.body.data.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });
    });

    test("should return 400 error if email is invalid", async () => {
      newUser.email = "invalidEmail";

      await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 error if email is already used", async () => {
      await insertUsers([userOne]);
      newUser.email = userOne.email;

      await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 error if password length is less than 8 characters", async () => {
      newUser.password = "passwo1";

      await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 error if password does not contain both letters and numbers", async () => {
      newUser.password = "password";

      await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);

      newUser.password = "11111111";

      await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe("POST /v1/auth/login", () => {
    test("should return 200 and login user if email and password match", async () => {
      let userRoleData = await Role.findOne({ name: "user" }).lean();

      if (userRoleData == null) {
        await insertRoles([userRole]);
        userRoleData = await Role.findOne({ name: "user" }).lean();
      }

      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
      };
      const res = await request(app)
        .post("/v1/auth/login")
        .send(loginCredentials)
        .expect(httpStatus.OK);
      expect(res.body.data.user).toEqual({
        _id: expect.anything(),
        first_name: userOne.first_name,
        last_name: userOne.last_name,
        email: userOne.email,
        role: "user",
        is_email_verified: userOne.is_email_verified,
      });

      expect(res.body.data.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });
    });

    test("should return 401 error if there are no users with that email", async () => {
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
      };

      const res = await request(app)
        .post("/v1/auth/login")
        .send(loginCredentials)
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        status: httpStatus.UNAUTHORIZED,
        message: "Incorrect email or password",
        data: {},
      });
    });

    test("should return 401 error if password is wrong", async () => {
      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: "wrongPassword1",
      };

      const res = await request(app)
        .post("/v1/auth/login")
        .send(loginCredentials)
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        status: httpStatus.UNAUTHORIZED,
        message: "Incorrect email or password",
        data: {},
      });
    });
  });

  describe("POST /v1/auth/logout", () => {
    test("should return 204 if refresh token is valid", async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, "days");
      const jti = uuidv4();
      const refreshToken = tokenService.generateToken(
        userOne._id.toString(),
        expires,
        jti,
        tokenTypes.REFRESH,
      );
      await tokenService.saveToken(
        jti,
        userOne._id.toString(),
        expires,
        tokenTypes.REFRESH,
      );
      await request(app)
        .post("/v1/auth/logout")
        .send({ refreshToken })
        .expect(httpStatus.NO_CONTENT);

      const dbRefreshTokenDoc = await Token.findOne({ token: refreshToken });
      expect(dbRefreshTokenDoc).toBe(null);
    });

    test("should return 400 error if refresh token is missing from request body", async () => {
      await request(app)
        .post("/v1/auth/logout")
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 404 error if refresh token is not found in the database", async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, "days");
      const jti = uuidv4();
      const refreshToken = tokenService.generateToken(
        userOne._id.toString(),
        expires,
        jti,
        tokenTypes.REFRESH,
      );

      await request(app)
        .post("/v1/auth/logout")
        .send({ refreshToken })
        .expect(httpStatus.NO_CONTENT);
    });

    test("should return 404 error if refresh token is blacklisted", async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, "days");
      const jti = uuidv4();
      const refreshToken = tokenService.generateToken(
        userOne._id.toString(),
        expires,
        jti,
        tokenTypes.REFRESH,
      );
      await tokenService.saveToken(
        jti,
        userOne._id.toString(),
        expires,
        tokenTypes.REFRESH,
        true,
      );

      await request(app)
        .post("/v1/auth/logout")
        .send({ refreshToken })
        .expect(httpStatus.NO_CONTENT);
    });
  });

  describe("POST /v1/auth/refresh-tokens", () => {
    test("should return 200 and new auth tokens if refresh token is valid", async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, "days");
      const jti = uuidv4();
      const refreshToken = tokenService.generateToken(
        userOne._id.toString(),
        expires,
        jti,
        tokenTypes.REFRESH,
      );
      await tokenService.saveToken(
        jti,
        userOne._id.toString(),
        expires,
        tokenTypes.REFRESH,
      );

      const res = await request(app)
        .post("/v1/auth/refresh-tokens")
        .send({ refreshToken })
        .expect(httpStatus.OK);

      expect(res.body.data).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });
      const payload = jwt.verify(
        res.body.data.refresh.token,
        config.jwt.secret,
      ) as jwt.JwtPayload;

      const dbRefreshTokenDoc = await Token.findOne({ jti: payload.jti });
      expect(dbRefreshTokenDoc).toMatchObject({
        type: tokenTypes.REFRESH,
        user: userOne._id,
        blacklisted: false,
      });
      const dbRefreshTokenCount = await Token.countDocuments({
        type: tokenTypes.REFRESH,
      });
      expect(dbRefreshTokenCount).toBe(1);
    });

    test("should return 400 error if refresh token is missing from request body", async () => {
      await request(app)
        .post("/v1/auth/refresh-tokens")
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 401 error if refresh token is signed using an invalid secret", async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, "days");
      const jti = uuidv4();
      const refreshToken = tokenService.generateToken(
        userOne._id.toString(),
        expires,
        jti,
        tokenTypes.REFRESH,
        "invalidSecret",
      );
      await tokenService.saveToken(
        jti,
        userOne._id.toString(),
        expires,
        tokenTypes.REFRESH,
      );

      await request(app)
        .post("/v1/auth/refresh-tokens")
        .send({ refreshToken })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 401 error if refresh token is not found in the database", async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, "days");
      const jti = uuidv4();
      const refreshToken = tokenService.generateToken(
        userOne._id.toString(),
        expires,
        jti,
        tokenTypes.REFRESH,
      );

      await request(app)
        .post("/v1/auth/refresh-tokens")
        .send({ refreshToken })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 401 error if refresh token is blacklisted", async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, "days");
      const jti = uuidv4();
      const refreshToken = tokenService.generateToken(
        userOne._id.toString(),
        expires,
        jti,
        tokenTypes.REFRESH,
      );
      await tokenService.saveToken(
        jti,
        userOne._id.toString(),
        expires,
        tokenTypes.REFRESH,
        true,
      );

      await request(app)
        .post("/v1/auth/refresh-tokens")
        .send({ refreshToken })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 401 error if refresh token is expired", async () => {
      await insertUsers([userOne]);
      const expires = moment().subtract(1, "minutes");
      const jti = uuidv4();
      const refreshToken = tokenService.generateToken(
        userOne._id.toString(),
        expires,
        jti,
        tokenTypes.REFRESH,
      );
      await tokenService.saveToken(
        jti,
        userOne._id.toString(),
        expires,
        tokenTypes.REFRESH,
      );

      await request(app)
        .post("/v1/auth/refresh-tokens")
        .send({ refreshToken })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 401 error if user is not found", async () => {
      const expires = moment().add(config.jwt.refreshExpirationDays, "days");
      const jti = uuidv4();
      const refreshToken = tokenService.generateToken(
        userOne._id.toString(),
        expires,
        jti,
        tokenTypes.REFRESH,
      );
      await tokenService.saveToken(
        jti,
        userOne._id.toString(),
        expires,
        tokenTypes.REFRESH,
      );

      await request(app)
        .post("/v1/auth/refresh-tokens")
        .send({ refreshToken })
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe("POST /v1/auth/forgot-password", () => {
    beforeEach(() => {
      jest.spyOn(emailService.transport, "sendMail").mockResolvedValue({});
    });

    test("should return 204 and send reset password email to the user", async () => {
      await insertUsers([userOne]);
      const sendResetPasswordEmailSpy = jest.spyOn(emailService, "sendMail");

      await request(app)
        .post("/v1/auth/forgot-password")
        .send({ email: userOne.email })
        .expect(httpStatus.NO_CONTENT);

      expect(sendResetPasswordEmailSpy).toHaveBeenCalledWith(
        emailConstants.USER_FORGOT_PASSWORD_TEMPLATE,
        expect.any(Object),
      );
      const resetPasswordToken = sendResetPasswordEmailSpy.mock.calls[0][1];
      const dbResetPasswordTokenDoc = await Token.findOne({
        token: resetPasswordToken.token,
        user: userOne._id,
      });
      expect(dbResetPasswordTokenDoc).toBeDefined();
    });

    test("should return 400 if email is missing", async () => {
      await insertUsers([userOne]);

      await request(app)
        .post("/v1/auth/forgot-password")
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 204 if email does not belong to any user", async () => {
      await request(app)
        .post("/v1/auth/forgot-password")
        .send({ email: userOne.email })
        .expect(httpStatus.NO_CONTENT);
    });
  });

  describe("POST /v1/auth/reset-password", () => {
    test("should return 204 and reset the password", async () => {
      await insertUsers([userOne]);
      const expires = moment().add(
        config.jwt.resetPasswordExpirationMinutes,
        "minutes",
      );
      const jti = uuidv4();
      const resetPasswordToken = tokenService.generateToken(
        userOne._id.toString(),
        expires,
        jti,
        tokenTypes.RESET_PASSWORD,
      );
      await tokenService.saveToken(
        jti,
        userOne._id.toString(),
        expires,
        tokenTypes.RESET_PASSWORD,
      );

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .send({ password: "123123@aA" })
        .expect(httpStatus.NO_CONTENT);

      const dbUser = await User.findById(userOne._id);
      const isPasswordMatch =
        dbUser?.password != null
          ? await bcrypt.compare("123123@aA", dbUser.password)
          : false;
      expect(isPasswordMatch).toBe(true);

      const dbResetPasswordTokenCount = await Token.countDocuments({
        user: userOne._id,
        type: tokenTypes.RESET_PASSWORD,
      });
      expect(dbResetPasswordTokenCount).toBe(0);
    });

    test("should return 400 if reset password token is missing", async () => {
      await insertUsers([userOne]);

      await request(app)
        .post("/v1/auth/reset-password")
        .send({ password: "password2" })
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 401 if reset password token is blacklisted", async () => {
      await insertUsers([userOne]);
      const expires = moment().add(
        config.jwt.resetPasswordExpirationMinutes,
        "minutes",
      );
      const jti = uuidv4();
      const resetPasswordToken = tokenService.generateToken(
        userOne._id.toString(),
        expires,
        jti,
        tokenTypes.RESET_PASSWORD,
      );
      await tokenService.saveToken(
        jti,
        userOne._id.toString(),
        expires,
        tokenTypes.RESET_PASSWORD,
        true,
      );

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .send({ password: "123123@aA" })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 401 if reset password token is expired", async () => {
      await insertUsers([userOne]);
      const expires = moment().subtract(1, "minutes");
      const jti = uuidv4();
      const resetPasswordToken = tokenService.generateToken(
        userOne._id.toString(),
        expires,
        jti,
        tokenTypes.RESET_PASSWORD,
      );
      await tokenService.saveToken(
        jti,
        userOne._id.toString(),
        expires,
        tokenTypes.RESET_PASSWORD,
      );

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .send({ password: "123123@aA" })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 401 if user is not found", async () => {
      const expires = moment().add(
        config.jwt.resetPasswordExpirationMinutes,
        "minutes",
      );
      const jti = uuidv4();
      const resetPasswordToken = tokenService.generateToken(
        userOne._id.toString(),
        expires,
        jti,
        tokenTypes.RESET_PASSWORD,
      );
      await tokenService.saveToken(
        jti,
        userOne._id.toString(),
        expires,
        tokenTypes.RESET_PASSWORD,
      );

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .send({ password: "123123@aA" })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 400 if password is missing or invalid", async () => {
      await insertUsers([userOne]);
      const expires = moment().add(
        config.jwt.resetPasswordExpirationMinutes,
        "minutes",
      );
      const jti = uuidv4();
      const resetPasswordToken = tokenService.generateToken(
        userOne._id.toString(),
        expires,
        jti,
        tokenTypes.RESET_PASSWORD,
      );
      await tokenService.saveToken(
        jti,
        userOne._id.toString(),
        expires,
        tokenTypes.RESET_PASSWORD,
      );

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .expect(httpStatus.BAD_REQUEST);

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .send({ password: "short1" })
        .expect(httpStatus.BAD_REQUEST);

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .send({ password: "password" })
        .expect(httpStatus.BAD_REQUEST);

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .send({ password: "11111111" })
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe("POST /v1/auth/send-verification-email", () => {
    beforeEach(() => {
      jest.spyOn(emailService.transport, "sendMail").mockResolvedValue({});
    });

    test("should return 204 and send verification email to the user", async () => {
      await insertUsers([userOne]);
      const sendVerificationEmailSpy = jest.spyOn(emailService, "sendMail");

      await request(app)
        .post("/v1/auth/send-verification-email")
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      expect(sendVerificationEmailSpy).toHaveBeenCalledWith(
        emailConstants.USER_EMAIL_VERIFICATION_TEMPLATE,
        expect.any(Object),
      );
      const verifyEmailToken = sendVerificationEmailSpy.mock.calls[0][1];
      const dbVerifyEmailToken = await Token.findOne({
        token: verifyEmailToken.token,
        user: userOne._id,
      });

      expect(dbVerifyEmailToken).toBeDefined();
    });

    test("should return 401 error if access token is missing", async () => {
      await insertUsers([userOne]);

      await request(app)
        .post("/v1/auth/send-verification-email")
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe("POST /v1/auth/verify-email", () => {
    test("should return 204 and verify the email", async () => {
      await insertUsers([userOne]);
      const expires = moment().add(
        config.jwt.verifyEmailExpirationMinutes,
        "minutes",
      );
      const jti = uuidv4();
      const verifyEmailToken = tokenService.generateToken(
        userOne._id.toString(),
        expires,
        jti,
        tokenTypes.VERIFY_EMAIL,
      );
      await tokenService.saveToken(
        jti,
        userOne._id.toString(),
        expires,
        tokenTypes.VERIFY_EMAIL,
      );

      await request(app)
        .post("/v1/auth/verify-email")
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.NO_CONTENT);

      const dbUser = await User.findById(userOne._id);
      expect(dbUser?.is_email_verified).toBe(true);

      const dbVerifyEmailToken = await Token.countDocuments({
        user: userOne._id,
        type: tokenTypes.VERIFY_EMAIL,
      });
      expect(dbVerifyEmailToken).toBe(0);
    });

    test("should return 400 if verify email token is missing", async () => {
      await insertUsers([userOne]);

      await request(app)
        .post("/v1/auth/verify-email")
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 401 if verify email token is blacklisted", async () => {
      await insertUsers([userOne]);
      const expires = moment().add(
        config.jwt.verifyEmailExpirationMinutes,
        "minutes",
      );
      const jti = uuidv4();
      const verifyEmailToken = tokenService.generateToken(
        userOne._id.toString(),
        expires,
        jti,
        tokenTypes.VERIFY_EMAIL,
      );
      await tokenService.saveToken(
        jti,
        userOne._id.toString(),
        expires,
        tokenTypes.VERIFY_EMAIL,
        true,
      );

      await request(app)
        .post("/v1/auth/verify-email")
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 401 if verify email token is expired", async () => {
      await insertUsers([userOne]);
      const expires = moment().subtract(1, "minutes");
      const jti = uuidv4();
      const verifyEmailToken = tokenService.generateToken(
        userOne._id.toString(),
        expires,
        jti,
        tokenTypes.VERIFY_EMAIL,
      );
      await tokenService.saveToken(
        jti,
        userOne._id.toString(),
        expires,
        tokenTypes.VERIFY_EMAIL,
      );

      await request(app)
        .post("/v1/auth/verify-email")
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 401 if user is not found", async () => {
      const expires = moment().add(
        config.jwt.verifyEmailExpirationMinutes,
        "minutes",
      );
      const jti = uuidv4();
      const verifyEmailToken = tokenService.generateToken(
        userOne._id.toString(),
        expires,
        jti,
        tokenTypes.VERIFY_EMAIL,
      );
      await tokenService.saveToken(
        jti,
        userOne._id.toString(),
        expires,
        tokenTypes.VERIFY_EMAIL,
      );

      await request(app)
        .post("/v1/auth/verify-email")
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });
  });
});

describe("Auth middleware", () => {
  test("should call next with no errors if access token is valid", async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` },
    });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req?.user?._id).toEqual(userOne._id);
  });

  test("should call next with unauthorized error if access token is not found in header", async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest();
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Please authenticate",
      }),
    );
  });

  test("should call next with unauthorized error if access token is not a valid jwt token", async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({
      headers: { Authorization: "Bearer randomToken" },
    });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Please authenticate",
      }),
    );
  });

  test("should call next with unauthorized error if the token is not an access token", async () => {
    await insertUsers([userOne]);
    const expires = moment().add(config.jwt.accessExpirationMinutes, "minutes");
    const jti = uuidv4();
    const refreshToken = tokenService.generateToken(
      userOne._id.toString(),
      expires,
      jti,
      tokenTypes.REFRESH,
    );
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Please authenticate",
      }),
    );
  });

  test("should call next with unauthorized error if access token is generated with an invalid secret", async () => {
    await insertUsers([userOne]);
    const expires = moment().add(config.jwt.accessExpirationMinutes, "minutes");
    const jti = uuidv4();
    const accessToken = tokenService.generateToken(
      userOne._id.toString(),
      expires,
      jti,
      tokenTypes.ACCESS,
      "invalidSecret",
    );
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Please authenticate",
      }),
    );
  });

  test("should call next with unauthorized error if access token is expired", async () => {
    await insertUsers([userOne]);
    const expires = moment().subtract(1, "minutes");
    const jti = uuidv4();
    const accessToken = tokenService.generateToken(
      userOne._id.toString(),
      expires,
      jti,
      tokenTypes.ACCESS,
    );
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Please authenticate",
      }),
    );
  });

  test("should call next with unauthorized error if user is not found", async () => {
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` },
    });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Please authenticate",
      }),
    );
  });

  test("should call next with forbidden error if user does not have required rights and userId is not in params", async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` },
    });
    const next = jest.fn();

    await auth("User", "get_all")(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.FORBIDDEN,
        message: "Forbidden",
      }),
    );
  });
});
