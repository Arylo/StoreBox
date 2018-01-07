import { Request, Response } from "express";
import pathExists = require("path-exists");
import fs = require("fs-extra");
import { config } from "@utils/config";
import { isDebug } from "./env";
import bunyan = require("bunyan");
import useragent = require("useragent");

// Logger Cache Factory Before Log File Create
interface ICachedSet {
    [name: string]: Array<{
        level: string, context: any[]
    }>;
}
const CACHEDLOGGERS: ICachedSet = { };
const cachedLog = (name: string) => {
    CACHEDLOGGERS[name] = [ ];
    const action = (level: string) => {
        return (...args) => {
            CACHEDLOGGERS[name].push({
                level: level,
                context: args
            });
        };
    };
    return {
        "trace": action("trace"),
        "debug": action("debug"),
        "info": action("info"),
        "warn": action("warng"),
        "error": action("error"),
        "fatal": action("fatal")
    };
};
const importCache = (name: string) => {
    const logger = LOGGERS[name];
    const cache = CACHEDLOGGERS[name];
    for (const item of cache) {
        logger[item.level](...item.context);
    }
    return logger;
};

// Logger Factory
const LOGGERS: { [key: string]: bunyan } = { };
const conventionalLog = (opts) => {
    if (LOGGERS[opts.name]) {
        return LOGGERS[opts.name];
    }
    const logFilePath = `${config.paths.log}/${opts.name}.log`;
    const options: bunyan.LoggerOptions = {
        name: opts.name,
        streams: [{
            type: "rotating-file",
            path: logFilePath,
            level: "info",
            period: "1m",
            count: 6
        }, {
            level: "trace",
            stream: process.stdout
        }]
    };
    LOGGERS[opts.name] = bunyan.createLogger(options);
    return LOGGERS[opts.name];
};
// Common Function Start

// Loggers Start
export let systemLogger: bunyan = cachedLog("system") as any;

export let accessLogger: bunyan = cachedLog("access") as any;

export let apiLogger: bunyan = cachedLog("api") as any;

export let downloadLogger: bunyan = cachedLog("download") as any;

export let errorLogger: bunyan = cachedLog("error") as any;
// Loggers End

// Init Strat
(async () => {
    try {
        if (!(await pathExists(config.paths.log))) {
            fs.mkdirp(config.paths.log);
        }
    } catch (error) {
        throw error;
    }
    (await initLoggers()).map((logger) => {
        logger.level(isDebug() ? "trace" : "info");
    });
})();
const initLoggers = () => {
    errorLogger = (() => {
        const FLAG = "error";
        if (LOGGERS[FLAG]) {
            return LOGGERS[FLAG];
        }
        const options: bunyan.LoggerOptions = {
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
        };
        LOGGERS[FLAG] = bunyan.createLogger(options);
        return LOGGERS[FLAG];
    })();
    importCache("error");
    systemLogger = conventionalLog({
        name: "system"
    });
    systemLogger.error = errorLogger.error;
    systemLogger.fatal = errorLogger.fatal;
    importCache("system");
    accessLogger = conventionalLog({
        name: "access"
    });
    importCache("access");
    apiLogger = conventionalLog({
        name: "api"
    });
    importCache("api");
    downloadLogger = conventionalLog({
        name: "download"
    });
    importCache("download");
    return [
        systemLogger, accessLogger, apiLogger, downloadLogger, errorLogger
    ];
};
// Init End

const getIp = (req: Request) => {
    const socket = req.socket;
    return req.ip || req.connection.remoteAddress ||
    (socket && socket.remoteAddress) ||
    ((socket as any).socket && (socket as any).socket.remoteAddress) ||
    "127.0.0.1";
};

const getUA = (req: Request) => {
    try {
        return useragent.parse(req.header["user-agent"]);
    } catch (error) {
        return req.header["user-agent"];
    }
};

export const getMeta = (err, req: Request) => {
    const meta = JSON.parse(JSON.stringify({
        "remote-address": getIp(req),
        ip: getIp(req),
        method: req.method,
        url: (req.baseUrl || "") + (req.url || "-"),
        referrer: req.header("referer") || req.header("referrer") || "-",
        ua: getUA(req),
        body: req.body,
        err: err || undefined
    }));
    // Hiddle Password
    for (const field of [ "password", "oldPassword", "newPassword" ]) {
        if (meta.body[field]) {
            meta.body[field] = "[HIDDLE]";
        }
    }
    return meta;
};
