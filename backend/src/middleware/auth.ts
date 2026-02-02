import { type NextFunction, type Request, type Response } from "express";
import httpStatus from "http-status";
import passport from "passport";
import ApiError from "../utils/ApiError";
import { type IUser } from "../models/user.model";

declare global {
  namespace Express {
    interface User extends IUser { }
  }
}

import { roleRights } from "../config/roles";

const verifyCallback =
  (
    req: Request,
    resolve: () => void,
    reject: (error: ApiError) => void,
    requiredRights: string[],
  ) =>
    async (err: Error, user: Express.User, info: any) => {
      if (err || info || !user) {
        reject(new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate"));
        return;
      }
      req.user = user;

      if (requiredRights.length) {
        const userRights = roleRights.get(user.role);
        const hasRequiredRights = requiredRights.every((requiredRight) =>
          userRights?.includes(requiredRight),
        );
        if (!hasRequiredRights && user.role !== "super_admin") {
          reject(new ApiError(httpStatus.FORBIDDEN, "Forbidden"));
          return;
        }
      }

      resolve();
    };

const auth =
  (...requiredRights: string[]) =>
    async (req: Request, res: Response, next: NextFunction) => {
      await new Promise<void>((resolve, reject) => {
        passport.authenticate(
          "jwt",
          { session: false },
          verifyCallback(req, resolve, reject, requiredRights),
        )(req, res, next);
      })
        .then(() => {
          next();
        })
        .catch((err: ApiError) => {
          next(err);
        });
    };

export default auth;
