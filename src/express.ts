import * as express from "express";
import * as session from "express-session";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import { access, error } from "./modules/common/middlewares/logger.middleware";

let server: express.Express;

export const initExpress = () => {
    if (server) {
        return server;
    }

    const mServer = express();

    mServer.enable("trust proxy");

    mServer.use(bodyParser.json());
    mServer.use(bodyParser.urlencoded({ extended: false }));
    mServer.use(cookieParser("storebox"));
    mServer.use(session({
        secret: "storebox",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false, maxAge: 1800 * 1000 }
    }));
    mServer.use(/^(?!\/files|\/api\/v1).*/, access);
    mServer.all("/files/*", (req, res, next) => {
        res.redirect(`/api/v1${req.url}`);
        next();
    });
    mServer.use(error);

    server = mServer;
    return server;
};
