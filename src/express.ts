import * as express from "express";
import * as session from "express-session";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";

let server;

export const initExpress = () => {
    if (server) {
        return server;
    }

    const mServer = express();

    mServer.enable("trust proxy");

    mServer.use(bodyParser.json());
    mServer.use(bodyParser.urlencoded({ extended: false }));
    mServer.use(cookieParser());
    mServer.use(session({
        secret: "packagebox",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false, maxAge: 1800 * 1000 }
    }));

    server = mServer;
    return server;
};
