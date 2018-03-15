import * as supertest from "supertest";
import categories = require("@db/categories");
import auth = require("@db/auth");
import * as db from "../../helpers/database";
import * as server from "../../helpers/server";
import { newName } from "../../helpers/utils";
import * as files from "../../helpers/files";
import goods = require("@db/goods");

/**
 * Fix [Issue 1](http://git.pbr.link/BoxSystem/StoreBox/issues/1)
 */
describe("Fix Issues", () => {

    let request: supertest.SuperTest<supertest.Test>;

    before(() => {
        return db.connect();
    });

    const ids = {
        users: [ ],
        categories: [ ],
        regexps: [ ],
        goods: [ ]
    };

    after(() => {
        return db.drop(ids);
    });

    before(async () => {
        request = await server.init();
    });

    const filepaths = [ ];
    after(() => {
        return files.remove(filepaths);
    });

    before("login", async () => {
        ids.users.push((await auth.login(request))[0]);
    });

    let cids = [ ];
    step("Add Category group", async () => {
        cids = await categories.addCategories();
        ids.categories.push(...cids);
    });

    describe("Gitlab 1 [Delete Good]", () => {

        const filename = newName();
        let cid;

        step("Add One Category with Regexp", async () => {
            const docs = await db.addCategoryAndRegexp(
                new RegExp(filename)
            );
            cid = docs[0]._id;
            ids.categories.push(cid);
            ids.regexps.push(docs[1]._id);
        });

        let gid;

        step("Upload File", async () => {
            const filepath = await files.newFile(filename);
            filepaths.push(filepath);
            await files.uploadFile(request, filepath);
            gid = await goods.getIdByOriginname(filename);
            ids.goods.push(gid);
        });

        step("Delete Good", async () => {
            const url = `/api/v1/goods/${gid}`;
            const { status } = await request.delete(url).then();
            status.should.be.eql(200);
        });

        step("404 for Good", async () => {
            const url = `/files/categories/${cid}/goods/${gid}`;
            const { status } = await request.get(url).then();
            status.should.be.eql(404);
        });

    });

    describe("Gitlab 1 [Move Good to Other Category]", () => {

        const filename = newName();

        step("Add One Category with Regexp", async () => {
            const docs = await db.addCategoryAndRegexp(
                new RegExp(filename)
            );
            ids.categories.push(docs[0]._id);
            ids.regexps.push(docs[1]._id);
        });

        let gid;

        step("Upload File", async () => {
            const filepath = await files.newFile(filename);
            filepaths.push(filepath);
            await files.uploadFile(request, filepath);
            gid = await goods.getIdByOriginname(filename);
            ids.goods.push(gid);
        });

        step("Move Good ", async () => {
            const url = `/api/v1/goods/${gid}`;
            const cid = ids.categories[5].toString();
            const { status } = await request.put(url)
                .send({ category: cid })
                .then();
            status.should.be.eql(200);

            const { body } = await request.get(url).then();
            body.category._id.toString().should.be.eql(cid);
        });

    });

});
