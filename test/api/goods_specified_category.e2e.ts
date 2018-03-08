import * as supertest from "supertest";
import db = require("../helpers/database");
import path = require("path");
import files = require("../helpers/files");
import auth = require("@db/auth");
import categories = require("@db/categories");
import * as regexps from "@db/regexps";
import * as goods from "@db/goods";
import { init } from "../helpers/server";
import { newName } from "../helpers/utils";

describe("Upload Good with specified categories", () => {

    let request: supertest.SuperTest<supertest.Test>;

    before(async () => {
        request = await init();
    });

    before(() => {
        return db.connect();
    });

    const ids = {
        categories: [ ],
        regexps: [ ],
        users: [ ],
        goods: [ ]
    };
    after(() => {
        return db.drop(ids);
    });

    const filepaths = [ ];
    after(() => {
        return files.remove(filepaths);
    });

    let cids = [ ];
    before(async () => {
        cids = await categories.addCategories();
        ids.categories.push(...cids);
    });

    before("login", async () => {
        ids.users.push((await auth.login(request))[0]);
    });

    const targetIndex = 6;

    step("Set Category and Regexp", async () => {
        const targetId = ids.categories[targetIndex];

        for (let i = 0; i < 3; i++) {
            const filepath = files.newFile();
            filepaths.push(filepath);
            const filename = path.basename(filepath);

            const regDoc = await regexps.newRegexp({
                name: newName(),
                value: new RegExp(filename).source,
                link: targetId,
                hidden: true
            });
            ids.regexps.push(regDoc._id);
        }
    });

    step("Default Upload Way Fail", async () => {
        const targetId = ids.categories[targetIndex];
        const filepath = filepaths[0];

        const { status } = await files.uploadFile(request, filepath);
        status.should.be.eql(400);
    });

    step("Upload File Success with Specified Category", async () => {
        const targetId = ids.categories[targetIndex];
        const filepath = filepaths[0];
        const filename = path.basename(filepath);

        const { status } = await files.uploadFile(
            request, filepath, { query: {
                "category": await categories.getNameById(targetId)
            }}
        );
        status.should.be.eql(201);
        ids.goods.push(await goods.getIdByOriginname(filename));
    });

    step("Upload File Success with Specified Parent Category", async () => {
        const targetId = ids.categories[targetIndex - 1];
        const filepath = filepaths[1];
        const filename = path.basename(filepath);

        const { status } = await files.uploadFile(
            request, filepath, { query: {
                "category": await categories.getNameById(targetId)
            }}
        );
        status.should.be.eql(201);
        ids.goods.push(await goods.getIdByOriginname(filename));
    });

    step("Upload File Fail with Specified Child Category", async () => {
        const targetId = ids.categories[8];
        const filepath = filepaths[1];
        const filename = path.basename(filepath);

        const { status } = await files.uploadFile(
            request, filepath, { query: {
                "category": await categories.getNameById(targetId)
            }}
        );
        status.should.be.eql(400);
    });

    step("Upload File Fail with Specified Child Category", async () => {
        const targetId = ids.categories[8];
        const filepath = filepaths[2];
        const filename = path.basename(filepath);

        const { status } = await files.uploadFile(
            request, filepath, { query: {
                "category": await categories.getNameById(targetId)
            }}
        );
        status.should.be.eql(400);
    });

    step("Upload File Fail with Specified Brother Category", async () => {
        const targetId = ids.categories[7];
        const filepath = filepaths[2];
        const filename = path.basename(filepath);

        const { status } = await files.uploadFile(
            request, filepath, { query: {
                "category": await categories.getNameById(targetId)
            }}
        );
        status.should.be.eql(400);
    });

});
