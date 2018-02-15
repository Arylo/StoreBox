import { ExpressMiddleware, Middleware, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Middleware()
export class Clear304Middleware implements NestMiddleware {
    public resolve(): ExpressMiddleware {
        return (req: Request, res: Response, next: NextFunction) => {
            const header = {
                // HTTP 1.1.
                "Cache-Control": "no-cache, no-store, must-revalidate",
                // HTTP 1.0.
                "Pragma": "no-cache",
                // Proxies.
                "Expires": "0"
            };
            for (const key of Object.keys(header)) {
                res.setHeader(key, header[key]);
            }
            next();
        };
    }
}
