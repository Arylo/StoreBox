import { config } from "@utils/config";
import { isTest } from "@utils/env";
import * as bodyParser from "body-parser";
import connectRedis = require("connect-redis");
import * as cookieParser from "cookie-parser";
import * as express from "express";
import session = require("express-session");
import helmet = require("helmet");
import { error } from "./middlewares/logger.middleware";

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
    /* istanbul ignore if */
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
