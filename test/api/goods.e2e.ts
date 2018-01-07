import supertest = require("supertest");
import path = require("path");
import faker = require("faker");
import { Model as UsersModel } from "@models/User";

import { connect, drop } from "../helpers/database";
import { uploadFile } from "../helpers/files";
import { addCategroyAndRegexp } from "../helpers/categroies";
import { init } from "../helpers/server";

describe("Goods Api", () => {

    let request: supertest.SuperTest<supertest.Test>;

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
        request = await init();
    });

    before(async () => {
        const obj = await UsersModel.addUser(user.name, user.pass);
        const { body: result } = await request.post("/api/v1/auth/login")
            .send({
                username: user.name, password: user.pass
            }).then();
    });

    beforeEach(async () => {
        await addCategroyAndRegexp(/^icon_.+64x64\.png$/);
    });

    it("Upload File", async () => {
        const filepath = `${__dirname}/../files/icon_pandorabox_64x64.png`;
        let result;
        // Create
        result = await uploadFile(request, filepath);
        result = result.body;

        result.should.have.properties([
            "_id", "originname", "categroy", "uploader"
        ]);
        result.should.have.property("originname", path.basename(filepath));

        // Get
        result = await request.get(`/api/v1/goods/${result._id}`).then();
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
            "_id", "nickname"
        ]);
        result.uploader.should.have.property("nickname", user.name);
    });

});
