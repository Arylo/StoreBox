import {
    Middleware, NestMiddleware, ExpressMiddleware, HttpException, HttpStatus
} from "@nestjs/common";

@Middleware()
export class AuthenticationMiddleware implements NestMiddleware {
    public resolve(): ExpressMiddleware {
        return (req, res, next) => {
            if (req.url === "/auth/login") {
                return next();
            }
            if (!req.session.loginUser) {
                throw new HttpException(
                    "Unauthorized", HttpStatus.UNAUTHORIZED
                );
            }
            next();
        };
    }
}
