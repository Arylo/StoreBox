import supertest = require("supertest-session");
import ST = require("supertest");
import { Test } from "@nestjs/testing";
import path = require("path");
import faker = require("faker");
import { Model as UsersModel } from "@models/User";

import { initExpress } from "../../src/express";
import { ApplicationModule } from "../../src/modules/app.module";
import { connect, drop } from "../helpers/database";
import { uploadFile } from "../helpers/files";
import { addCategroyAndRegexp } from "../helpers/categroies";
import { sleep } from "../helpers/utils";

describe("Goods Api", () => {

    let request: ST.SuperTest<ST.Test>;
    const server = initExpress();

    const user = {
        name: faker.name.firstName(),
        pass: faker.random.words()
    };

    before(async () => {
        connect();
    });

    afterEach(() => {
        return drop();
    });

    before(async () => {
        const module = await Test.createTestingModule({
            modules: [ApplicationModule]
        })
        .compile();
        const app = module.createNestApplication(server);
        await app.init();
        request = supertest(server);
    });

    before(async () => {
        const obj = await UsersModel.addUser(user.name, user.pass);
        const { body: result } = await request.post("/auth/login")
            .send({
                username: user.name, password: user.pass
            }).then();
    });

    it("Download File", async () => {
        const filepath = `${__dirname}/../files/icon_pandorabox_64x64.png`;
        const filename = path.basename(filepath);
        const cid = (await addCategroyAndRegexp(/^icon_.+64x64\.png$/))[0]._id;
        const id = (await uploadFile(request, filepath)).body._id;

        await sleep(500);

        const result = await request.get(`/files/${cid}/${id}`).then();
        result.status.should.be.eql(200);
        result.header.should.match({
            "content-disposition": new RegExp(`filename=['"]${filename}['"]`)
        });
    });

    it("Download Nonexist File", async () => {
        const url = "/files/5a44d78fec77afe7c8aa3eca/5a44d78fec77afe7c8aa3eca";
        const result = await request.get(url).then();

        result.status.should.be.eql(404);
    });

    it("Download Wrong ID File", async () => {
        const url = "/files/1111/1111";
        const result = await request.get(url).then();

        result.status.should.be.eql(400);
    });
});
