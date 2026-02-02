import moment from "moment";
import config from "../../src/config/config";
import { tokenTypes } from "../../src/config/tokens";
import * as tokenService from "../../src/services/token.service";
import { admin, userOne, userTwo } from "./user.data";
import { Token } from "../../src/models";

const accessTokenExpires: moment.Moment = moment().add(
  config.jwt.accessExpirationMinutes,
  "minutes",
);
const jti1: string = "25377e9a-545f-4b88-a83e-5d39d11b5544";
const userOneAccessToken: string = tokenService.generateToken(
  userOne._id.toString(),
  accessTokenExpires,
  jti1,
  tokenTypes.ACCESS,
);

const jti2: string = "25377e9a-545f-4b88-a83e-5d39d11b5545";
const userTwoAccessToken: string = tokenService.generateToken(
  userTwo._id.toString(),
  accessTokenExpires,
  jti2,
  tokenTypes.ACCESS,
);

const jti3: string = "25377e9a-545f-4b88-a83e-5d39d11b5546";
const adminAccessToken: string = tokenService.generateToken(
  admin._id.toString(),
  accessTokenExpires,
  jti3,
  tokenTypes.ACCESS,
);

const insertAccessTokens = async (): Promise<void> => {
  try {
    await Token.deleteMany({});
    await Token.insertMany([
      {
        jti: jti1,
        user: userOne._id,
        expires: accessTokenExpires,
        type: tokenTypes.ACCESS,
      },
      {
        jti: jti2,
        user: userTwo._id,
        expires: accessTokenExpires,
        type: tokenTypes.ACCESS,
      },
      {
        jti: jti3,
        user: admin._id,
        expires: accessTokenExpires,
        type: tokenTypes.ACCESS,
      },
    ]);
  } catch (err) {
    console.log("ERROR WHILE INSERTING TOKENS: ", err);
  }
};

export {
  adminAccessToken,
  userOneAccessToken,
  userTwoAccessToken,
  insertAccessTokens,
};
