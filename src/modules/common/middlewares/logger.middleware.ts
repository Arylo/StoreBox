import { RequestHandler, ErrorRequestHandler, Request } from "express";
import {
    Middleware, NestMiddleware, ExpressMiddleware
} from "@nestjs/common";
import pathExists = require("path-exists");
import fs = require("fs-extra");
import { config } from "@utils/config";
import bunyan = require("bunyan");
import useragent = require("useragent");

(async () => {
    if (!(await pathExists(config.paths.log))) {
        fs.mkdirp(config.paths.log);
    }
})();

const logs: { [key: string]: bunyan } = { };
const conventionalLog = (opts) => {
    if (logs[opts.name]) {
        return logs[opts.name];
    }
    const options: bunyan.LoggerOptions = {
        name: opts.name,
        streams: [{
            type: "rotating-file",
            path: `${config.paths.log}/${opts.name}.log`,
            level: "info",
            period: "1m",
            count: 6
        }]
    };
    if (process.env.NODE_ENV.trim() !== "test") {
        options.streams.push({
            level: "trace",
            stream: process.stdout
        });
    }
    logs[opts.name] = bunyan.createLogger({
        name: opts.name
    });
    return logs[opts.name];
};

const getIp = (req: Request) => {
    return req.ip || req.connection.remoteAddress ||
    (req.socket && req.socket.remoteAddress) ||
    ((req.socket as any).socket && (req.socket as any).socket.remoteAddress) ||
    "127.0.0.1";
};

const getUA = (req: Request) => {
    try {
        return useragent.parse(req.header["user-agent"]);
    } catch (error) {
        return req.header["user-agent"];
    }
};

const getMeta = (err, req, res) => {
    const meta = {
        "remote-address": getIp(req),
        ip: getIp(req),
        method: req.method,
        url: (req.baseUrl || "") + (req.url || "-"),
        referrer: req.header("referer") || req.header("referrer") || "-",
        ua: getUA(req),
        body: req.body,
        "status-code": res.statusCode,
        err: err || undefined
    };
    return meta;
};

const accessLogger = conventionalLog({
    name: "access"
});
export const access: RequestHandler = (req, res, next) => {
    const logger = accessLogger;
    const meta = getMeta(null, req, res);
    logger.info(meta);
    next();
};

export const apiLogger = conventionalLog({
    name: "api"
});
const api: RequestHandler = (req, res, next) => {
    const logger = apiLogger;
    const meta = getMeta(null, req, res);
    logger.info(meta);
    next();
};

export const downloadLogger = conventionalLog({
    name: "download"
});
const download: RequestHandler = (req, res, next) => {
    const logger = downloadLogger;
    const meta = getMeta(null, req, res);
    logger.info(meta);
    next();
};

export const error: ErrorRequestHandler = (err, req, res, next) => {
    bunyan.createLogger({
        name: "error",
        level: "error",
        streams: [{
            type: "rotating-file",
            path: `${config.paths.log}/error.log`,
            period: "1m",
            count: 6
        }, {
            stream: process.stderr
        }]
    });
};

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
