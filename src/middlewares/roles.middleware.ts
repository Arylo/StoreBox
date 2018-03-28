import {
    Middleware, NestMiddleware, ExpressMiddleware, HttpStatus,
    UnauthorizedException
} from "@nestjs/common";
import { Request, Response } from "express";
import basicAuth = require("basic-auth");
import { Model as TokensModel } from "@models/Token";
import { TokensService } from "@services/tokens";

@Middleware()
export class RolesMiddleware implements NestMiddleware {

    constructor(private readonly tokensSvr: TokensService) { }

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
                const isVaild =
                    await this.tokensSvr.isVaild(tokenUser.name, tokenUser.pass);
                if (isVaild) {
                    user.account = tokenUser.name;
                    user.token = tokenUser.pass;
                    user.roles.push("token");
                    next();
                } else {
                    next();
                }
                return;
            }
            const session = (req as any).session;
            if (session && session.loginUser) {
                user.account = session.loginUser;
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
