import { ExpressMiddleware, Middleware, NestMiddleware } from "@nestjs/common";
import helmet = require("helmet");

@Middleware()
export class NoCacheMiddleware implements NestMiddleware {
    public resolve(): ExpressMiddleware {
        return helmet.noCache();
    }
}
