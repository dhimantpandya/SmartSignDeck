import {
  Strategy as JwtStrategy,
  ExtractJwt,
  type VerifiedCallback,
  type StrategyOptions,
} from "passport-jwt";
import User from "../models/user.model";
import config from "./config";
import { tokenTypes } from "./tokens";

// Cookie extractor
const cookieExtractor = (req: any) => {
  if (req?.cookies) {
    return req.cookies.token; // 'token' is the cookie name set in auth.controller
  }
  return null;
};

interface JwtPayload {
  type: string;
  sub: string;
  jti: string;
}

const jwtOptions: StrategyOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
    cookieExtractor,
  ]),
};

const verifyJwt = async (
  payload: JwtPayload,
  done: VerifiedCallback,
): Promise<void> => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error("Invalid token type");
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      done(null, false);
      return;
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const jwtStrategy = new JwtStrategy(jwtOptions, verifyJwt);

export { jwtStrategy };
