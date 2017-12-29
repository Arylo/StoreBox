import {
    Middleware, NestMiddleware, ExpressMiddleware, HttpStatus,
    UnauthorizedException
} from "@nestjs/common";

@Middleware()
export class AuthenticationMiddleware implements NestMiddleware {
    public resolve(): ExpressMiddleware {
        return (req, res, next) => {
            if (req.url === "/auth/login") {
                return next();
            }
            if (/^\/files/.test(req.url)) {
                return next();
            }
            if (!req.session.loginUser) {
                throw new UnauthorizedException();
            }
            next();
        };
    }
}
