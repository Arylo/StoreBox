import {
    ExpressMiddleware, Middleware, NestMiddleware
} from "@nestjs/common";
import {
    accessLogger, apiLogger, downloadLogger, getMeta, systemLogger
} from "@utils/log";
import { ErrorRequestHandler, Request, RequestHandler } from "express";

const access: RequestHandler = (req, res, next) => {
    // const logger = accessLogger;
    // const meta = getMeta(null, req);
    // logger.info(meta);
    next();
};

const api: RequestHandler = (req, res, next) => {
    const logger = apiLogger;
    const meta = getMeta(null, req);
    logger.info(meta);
    next();
};

const download: RequestHandler = (req, res, next) => {
    const logger = downloadLogger;
    const meta = getMeta(null, req);
    logger.info(meta);
    next();
};

export const error: ErrorRequestHandler = (err, req, res, next) => {
    const logger = systemLogger;
    const meta = getMeta(err, req);
    logger.error(meta);
    next();
};

@Middleware()
export class AccessLoggerMiddleware implements NestMiddleware {
    public resolve(): ExpressMiddleware {
        return access;
    }
}

@Middleware()
export class ApiLoggerMiddleware implements NestMiddleware {
    public resolve(): ExpressMiddleware {
        return api;
    }
}

@Middleware()
export class DownloadLoggerMiddleware implements NestMiddleware {
    public resolve(): ExpressMiddleware {
        return download;
    }
}
