import fs = require("fs-extra");
import { basename } from "path";

import {
    connect, drop, addCategoryAndRegexp
} from "../../helpers/database";
import { init } from "../../helpers/server";
import * as files from "../../helpers/files";

import { newIds } from "../../helpers/utils";
import { AdminRequest, GuestRequest } from "../../helpers/request";

/**
 * Fix [Issue 31](https://github.com/BoxSystem/StoreBox-Api/issues/31)
 */
describe("Fix Issues", () => {

    let request: AdminRequest;

    before(() => {
        return connect();
    });

    const ids = newIds();
    const filepaths = [ ];

    after(() => {
        return drop(ids);
    });

    before("login", async () => {
        request = await new GuestRequest(await init(), ids, filepaths).login();
    });

    before(async () => {
        await request.newFile();
    });

    after(() => {
        return files.remove(filepaths);
    });

    describe("Github 31 [Can upload same file]", () => {

        step("Add Category and Regexp", async () => {
            const filepath = filepaths[filepaths.length - 1];
            const filename = basename(filepath);
            const docs = await addCategoryAndRegexp(
                new RegExp(`^${filename}$`)
            );
            ids.categories.push(docs[0]._id);
            ids.regexps.push(docs[1]._id);
        });

        step("Upload Success", async () => {
            const { status } = await request.uploadFile();
            status.should.be.eql(201);
        });

        step("Upload Fail", async () => {
            const { status, body } = await request.uploadFile();
            status.should.be.not.eql(201);
            status.should.be.eql(400);
        });

    });
});
