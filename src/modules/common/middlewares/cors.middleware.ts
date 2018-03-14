import { Middleware, NestMiddleware, ExpressMiddleware } from "@nestjs/common";
import * as cors from "cors";

@Middleware()
export class CorsMiddleware implements NestMiddleware {
    public resolve(...args: any[]): ExpressMiddleware {
        return (req, res, next) => {
            return cors();
        };
    }
}
