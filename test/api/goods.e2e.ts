import supertest = require("supertest");
import path = require("path");
import faker = require("faker");

import { connect, drop, addCategoryAndRegexp } from "../helpers/database";
import { uploadFile } from "../helpers/files";
import { init } from "../helpers/server";
import auth = require("../helpers/database/auth");
import { newName } from "../helpers/utils";

describe("Goods E2E Api", () => {

    let request: supertest.SuperTest<supertest.Test>;

    const user = {
        name: newName()
    };

    before(async () => {
        connect();
    });

    const ids = {
        users: [ ],
        categories: [ ],
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

    before("login", async () => {
        ids.users.push((await auth.login(request, user.name))[0]);
    });

    step("Add Category", async () => {
        const docs = await addCategoryAndRegexp(/^icon_.+_64x64\.png$/);
        ids.categories.push(docs[0]._id);
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
            "_id", "originname", "category", "uploader"
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
            "category", "uploader"
        ]);
        result.category.should.have.properties([
            "_id", "name", "attributes", "tags"
        ]);
        result.uploader.should.have.properties([
            "_id", "nickname"
        ]);
        result.uploader.should.have.property("nickname", user.name);
    });

});
