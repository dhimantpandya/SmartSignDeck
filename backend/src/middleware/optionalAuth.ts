import { type NextFunction, type Request, type Response } from "express";
import passport from "passport";
import { type IUser } from "../models/user.model";

const optionalAuth = () => async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
        "jwt",
        { session: false },
        (err: any, user: IUser | false, info: any) => {
            if (user) {
                req.user = user;
            }
            // Always proceed, even if no user
            next();
        }
    )(req, res, next);
};

export default optionalAuth;
