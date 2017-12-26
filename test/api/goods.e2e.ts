import supertest = require("supertest-session");
import ST = require("supertest");
import { Test } from "@nestjs/testing";
import path = require("path");
import faker = require("faker");
import { Model as UsersModel } from "@models/User";
import { Model as RegexpsModel } from "@models/Regexp";
import { Model as CategroyModel } from "@models/Categroy";
import "should";

import { initExpress } from "../../src/express";
import { ApplicationModule } from "../../src/modules/app.module";
import { connect, drop } from "../helpers/database";

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

    beforeEach(async () => {
        const { _id: categroyId } = await CategroyModel.create({
            name: faker.name.findName()
        });
        const reg = await RegexpsModel.addRegexp(
            faker.random.word(), /^icon_.+64x64\.png$/.source
        );
        await RegexpsModel.link(reg._id, categroyId);
    });

    it("Upload File", async () => {
        const filepath = `${__dirname}/../files/icon_pandorabox_64x64.png`;
        let result;
        // Create
        result = await request.post("/goods")
            .attach("file", filepath)
            .then();
        result = result.body;

        result.should.have.properties([
            "_id", "originname", "categroy", "uploader"
        ]);
        result.should.have.property("originname", path.basename(filepath));

        // Get
        result = await request.get(`/goods/${result._id}`).then();
        result = result.body;
        result.should.have.properties([
            "_id", "createdAt", "updatedAt",
            "filename", "originname", "attributes", "tags", "active", "hidden",
            "categroy", "uploader"
        ]);
        result.categroy.should.have.properties([
            "_id", "name", "attributes", "tags"
        ]);
        result.uploader.should.have.properties([
            "_id", "username", "nickname"
        ]);
    });

});
