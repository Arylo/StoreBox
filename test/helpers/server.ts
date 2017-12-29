import supertest = require("supertest-session");
import ST = require("supertest");

import { Test } from "@nestjs/testing";

import { initExpress } from "../../src/express";
import { ApplicationModule } from "../../src/modules/app.module";
import { ControllersModule } from "../../src/modules/controllers.module";
import { ValidationPipe } from "../../src/modules/common/pipes/validation.pipe";

let request: ST.SuperTest<ST.Test>;
const server = initExpress();

const start = async (modules: any[]) => {
    const module = await Test.createTestingModule({
        modules: modules
    }).compile();
    const app = module.createNestApplication(server);
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    request = supertest(server);
    return request;
};

export const init = () => {
    return start([ControllersModule]);
};

export const initWithAuth = async () => {
    return start([ApplicationModule]);
};
