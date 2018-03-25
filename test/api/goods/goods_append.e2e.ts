import * as supertest from "supertest";
import path = require("path");
import { init } from "../../helpers/server";
import db = require("../../helpers/database");
import auth = require("@db/auth");
import goods = require("@db/goods");
import regexps = require("@db/regexps");
import files = require("../../helpers/files");
import categories = require("@db/categories");
import { newName, newIds } from "../../helpers/utils";

describe("Upload Good with Append categories", () => {

    let request: supertest.SuperTest<supertest.Test>;

    before(async () => {
        request = await init();
    });

    before(() => {
        return db.connect();
    });

    const ids = newIds();

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

    step("Add File and its Regexps", async () => {
        for (let i = 0; i < 2; i++) {
            const filepath = await files.newFile();
            filepaths.push(filepath);
            const filename = path.basename(filepath);

            ids.regexps.push((await regexps.newRegexp({
                name: newName(),
                value: new RegExp(filename).source,
                link: ids.categories[6],
                hidden: true
            }))._id);
            ids.regexps.push((await regexps.newRegexp({
                name: newName(),
                value: new RegExp(filename).source,
                link: ids.categories[7],
                hidden: false
            }))._id);
        }
    });

    step("Upload File Fail", async () => {
        const targetIndex = 6;
        const targetId = ids.categories[targetIndex];
        const filepath = filepaths[0];
        const filename = path.basename(filepath);

        const { status, body: result } = await files.uploadFile(
            request, filepath, { query: {
                "append": encodeURI(await categories.getNameById(targetId))
            }}
        );
        status.should.be.eql(400);
    });

    step("Upload File Success", async () => {
        const targetIndex = 6;
        const targetId = ids.categories[targetIndex];
        const filepath = filepaths[0];
        const filename = path.basename(filepath);

        const { status } = await files.uploadFile(request, filepath);
        status.should.be.eql(201);
        ids.goods.push(await goods.getIdByOriginname(filename));
    });

});
