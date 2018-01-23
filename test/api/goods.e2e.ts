import supertest = require("supertest");
import path = require("path");
import faker = require("faker");

import { connect, drop, addCategroyAndRegexp, newUser } from "../helpers/database";
import { uploadFile } from "../helpers/files";
import { init } from "../helpers/server";

describe("Goods E2E Api", () => {

    let request: supertest.SuperTest<supertest.Test>;

    const user = {
        name: faker.name.firstName(),
        pass: faker.random.words()
    };

    before(async () => {
        connect();
    });

    const ids = {
        users: [ ],
        categroies: [ ],
        values: [ ],
        regexps: [ ],
        goods: [ ]
    };

    after(() => {
        return drop(ids);
    });

    before(async () => {
        request = await init();
    });

    step("Login", async () => {
        const doc = await newUser(user.name, user.pass);
        ids.users.push(doc._id);
        const { body: result } = await request.post("/api/v1/auth/login")
            .send({
                username: user.name, password: user.pass
            }).then();
    });

    step("Add Categroy", async () => {
        const docs = await addCategroyAndRegexp(/^icon_.+_64x64\.png$/);
        ids.categroies.push(docs[0]._id);
        ids.regexps.push(docs[1]._id);
    });

    let result;
    step("Upload File", async () => {
        const filepath = `${__dirname}/../files/icon_pandorabox_64x64.png`;
        // Create
        result = await uploadFile(request, filepath);
        result = result.body;

        ids.goods.push(result._id);
        result.should.have.properties([
            "_id", "originname", "categroy", "uploader"
        ]);
        result.should.have.property("originname", path.basename(filepath));
    });

    step("Get Good Info", async () => {
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
