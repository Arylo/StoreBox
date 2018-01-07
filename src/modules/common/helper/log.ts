import { Request, Response } from "express";
import pathExists = require("path-exists");
import fs = require("fs-extra");
import { config } from "@utils/config";
import bunyan = require("bunyan");
import useragent = require("useragent");

(async () => {
    if (!(await pathExists(config.paths.log))) {
        await fs.mkdirp(config.paths.log);
    }
    systemLogger = conventionalLog({
        name: "system"
    });
    systemLogger.error = errorLogger().error;
    systemLogger.fatal = errorLogger().fatal;
    accessLogger = conventionalLog({
        name: "access"
    });
    apiLogger = conventionalLog({
        name: "api"
    });
    downloadLogger = conventionalLog({
        name: "download"
    });
})();

const isDebug = () => {
    const envValues = ["development", "test"];
    return envValues.find((item) => item === process.env.NODE_ENV);
};

const logs: { [key: string]: bunyan } = { };
const conventionalLog = (opts) => {
    if (logs[opts.name]) {
        return logs[opts.name];
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
        }]
    };
    if (isDebug()) {
        options.streams.push({
            level: "trace",
            stream: process.stdout
        });
    }
    logs[opts.name] = bunyan.createLogger(options);
    return logs[opts.name];
};

export let systemLogger: bunyan = null;

export let accessLogger: bunyan = null;

export let apiLogger: bunyan = null;

export let downloadLogger: bunyan = null;

export const errorLogger = () => {
    const FLAG = "error";
    if (logs[FLAG]) {
        return logs[FLAG];
    }
    const options: bunyan.LoggerOptions = {
        name: "error",
        level: "error",
        streams: [{
            type: "rotating-file",
            path: `${config.paths.log}/error.log`,
            period: "1m",
            count: 6
        }]
    };
    if (isDebug()) {
        options.streams.push({
            stream: process.stderr
        });
    }
    logs[FLAG] = bunyan.createLogger(options);
    return logs[FLAG];
};

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
