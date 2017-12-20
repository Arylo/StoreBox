import * as express from "express";
import * as session from "express-session";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import { NestFactory } from "@nestjs/core";

import { config } from "@utils/config";
import { ApplicationModule } from "./modules/app.module";

const bootstrap = async () => {
    const server = express();

    server.enable("trust proxy");

    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({ extended: false }));
    server.use(cookieParser());
    server.use(session({
        secret: "packagebox",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false, maxAge: 1800 * 1000 }
    }));

    const app = await NestFactory.create(ApplicationModule, server);
    app.setGlobalPrefix("/api/v1");
    await app.listen(config.server.port);
    return app.getHttpServer();
};

export = bootstrap();
