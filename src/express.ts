import * as express from "express";
import session = require("express-session");
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import connectRedis = require("connect-redis");
import { config } from "@utils/config";
import helmet = require("helmet");

import { error } from "./modules/common/middlewares/logger.middleware";
import { isTest } from "./modules/common/helper/env";

const RedisStore = connectRedis(session);

let server: express.Express;

export const initExpress = () => {
    /* istanbul ignore if */
    if (server) {
        return server;
    }

    const mServer = express();

    mServer.enable("trust proxy");

    mServer.use(helmet());
    mServer.use(bodyParser.json());
    mServer.use(bodyParser.urlencoded());
    mServer.use(cookieParser("storebox"));
    const sessionOpts = {
        store: undefined,
        secret: "storebox",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false, maxAge: 7200 * 1000 }
    };
    if (!isTest) {
        sessionOpts.store = new RedisStore({
            url: config.redis.url
        });
    }
    mServer.use(session(sessionOpts));
    mServer.use(error);

    server = mServer;
    return server;
};
