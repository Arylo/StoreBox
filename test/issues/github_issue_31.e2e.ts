import supertest = require("supertest");
import faker = require("faker");
import fs = require("fs-extra");
import { basename } from "path";

import { Model as GoodsModels } from "@models/Good";
import {
    connect, drop, newUser, addCategoryAndRegexp
} from "../helpers/database";
import { init } from "../helpers/server";
import { uploadFile } from "../helpers/files";

import { config } from "@utils/config";

/**
 * Fix [Issue 31](https://github.com/Arylo/StoreBox/issues/31)
 */
describe("Fix Issues", () => {

    let request: supertest.SuperTest<supertest.Test>;

    before(() => {
        return connect();
    });

    const ids = {
        users: [ ],
        categories: [ ],
        regexps: [ ]
    };

    after(() => {
        return drop(ids);
    });

    before(async () => {
        request = await init();
    });

    describe("Github 31 [Can upload same file]", () => {

        let filepath = "";
        let filename = "";
        before(() => {
            const folderpath = `${config.paths.tmp}/test`;
            if (!fs.existsSync(folderpath)) {
                fs.mkdirpSync(folderpath);
            }
            filepath = `${folderpath}/${faker.random.uuid()}`;
            fs.writeFileSync(filepath, JSON.stringify({
                data: Math.random()
            }), { encoding: "utf-8" });
        });

        after(() => {
            fs.removeSync(filepath);
        });

        after(() => {
            GoodsModels.remove({
                originname: filename
            }).exec();
        });

        const user = {
            name: faker.name.firstName(),
            pass: faker.random.words()
        };
        step("Login", async () => {
            const doc = await newUser(user.name, user.pass);
            ids.users.push(doc._id);
            await request.post("/api/v1/auth/login")
                .send({
                    username: user.name, password: user.pass
                }).then();
        });

        step("Add Category and Regexp", async () => {
            filename = basename(filepath);
            const docs = await addCategoryAndRegexp(
                new RegExp(`^${filename}$`)
            );
            ids.categories.push(docs[0]._id);
            ids.regexps.push(docs[1]._id);
        });

        step("Upload Success", async () => {
            const {
                body: result, status
            } = await uploadFile(request, filepath);
            status.should.be.eql(201);
        });

        step("Upload Fail", async () => {
            const {
                body: result, status
            } = await uploadFile(request, filepath);
            status.should.be.not.eql(201);
            status.should.be.eql(400);
        });

    });
});
