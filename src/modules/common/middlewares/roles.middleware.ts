import {
    Middleware, NestMiddleware, ExpressMiddleware, HttpStatus,
    UnauthorizedException
} from "@nestjs/common";
import { Request, Response } from "express";
import basicAuth = require("basic-auth");
import { Model as TokensModel } from "@models/Token";
import { IUser } from "@models/User";

@Middleware()
export class RolesMiddleware implements NestMiddleware {
    public resolve(): ExpressMiddleware {
        return async (req: Request, res: Response, next) => {
            let user = (req as any).user;
            if (!user) {
                user = (req as any).user = {
                    roles: [ "guest" ]
                };
            }
            const tokenUser = basicAuth(req);
            if (tokenUser && tokenUser.name && tokenUser.pass) {
                if (await TokensModel.isVaild(tokenUser.name, tokenUser.pass)) {
                    user.account = tokenUser.name;
                    user.token = tokenUser.pass;
                    user.roles.push("token");
                    next();
                    return;
                }
            }
            if ((req as any).session.loginUser) {
                user.account = (req as any).session.loginUser;
                user.roles.push("admin");
                // throw new UnauthorizedException();
            }
            // if (req.path === "/api/v1/auth/login") {
            //     return next();
            // }
            // if (/^\/files/.test(req.url)) {
            //     return next();
            // }
            next();
        };
    }
}
