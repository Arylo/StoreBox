import { ExpressMiddleware, Middleware, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

/**
 * 延长Session过期时间
 */
@Middleware()
export class ReloadSessionMiddleware implements NestMiddleware {
    public resolve(): ExpressMiddleware {
        return (req: Request, res: Response, next: NextFunction) => {
            if (req.session.loginUser && req.session.loginUserId) {
                req.session.reload((err) => {
                    if (err) {
                        next(err);
                    } else {
                        next();
                    }
                });
            } else {
                next();
            }
        };
    }
}
