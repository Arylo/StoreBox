import {
    Middleware, NestMiddleware, ExpressMiddleware, HttpStatus,
    UnauthorizedException
} from "@nestjs/common";
import { Request, Response } from "express";
import basicAuth = require("basic-auth");
import { Model as TokensModel } from "@models/Token";
import { IUser } from "@models/User";

@Middleware()
export class AuthenticationMiddleware implements NestMiddleware {
    public resolve(): ExpressMiddleware {
        return async (req: Request, res: Response, next) => {
            const tokenUser = basicAuth(req);
            if (tokenUser && tokenUser.name && tokenUser.pass) {
                const token =
                    await TokensModel.findOne({ token: tokenUser.pass })
                    .populate("user", "username")
                    .exec();
                const tokenOwn = token.toObject().user as IUser;
                if (tokenOwn.username === tokenUser.name) {
                    next();
                    return;
                }
            }
            if (req.path === "/api/v1/auth/login") {
                return next();
            }
            if (/^\/files/.test(req.url)) {
                return next();
            }
            if (!(req as any).session.loginUser) {
                throw new UnauthorizedException();
            }
            next();
        };
    }
}
