import supertest = require("supertest");
import fs = require("fs-extra");
import { basename } from "path";

import { Model as GoodsModels } from "@models/Good";
import {
    connect, drop, newUser, addCategoryAndRegexp
} from "../../helpers/database";
import { init } from "../../helpers/server";
import * as files from "../../helpers/files";

import { config } from "@utils/config";
import auth = require("@db/auth");

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
        before(async () => {
            filepath = await files.newFile();
        });

        after(() => {
            return files.remove(filepath);
        });

        after(() => {
            GoodsModels.remove({
                originname: filename
            }).exec();
        });

        before("login", async () => {
            ids.users.push((await auth.login(request))[0]);
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
            } = await files.uploadFile(request, filepath);
            status.should.be.eql(201);
        });

        step("Upload Fail", async () => {
            const {
                body: result, status
            } = await files.uploadFile(request, filepath);
            status.should.be.not.eql(201);
            status.should.be.eql(400);
        });

    });
});
