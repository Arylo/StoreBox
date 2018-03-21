import * as supertest from "supertest";
import categories = require("@db/categories");
import auth = require("@db/auth");
import * as db from "../../helpers/database";
import * as server from "../../helpers/server";
import { newName } from "../../helpers/utils";

/**
 * Fix [Issue 2](http://git.pbr.link/Arylo/StoreBox/issues/2)
 */
describe("Fix Issues", () => {

    let request: supertest.SuperTest<supertest.Test>;

    before(() => {
        return db.connect();
    });

    const ids = {
        users: [ ],
        categories: [ ],
        regexps: [ ]
    };

    after(() => {
        return db.drop(ids);
    });

    before(async () => {
        request = await server.init();
    });

    describe("Gitlab 2 [Cant Modify Regexp link]", () => {

        before("login", async () => {
            ids.users.push((await auth.login(request))[0]);
        });

        let cids = [ ];
        step("Add Category group", async () => {
            cids = await categories.addCategories();
            ids.categories.push(...cids);
        });

        step("Add One Category with Regexp", async () => {
            const docs = await db.addCategoryAndRegexp(
                new RegExp(newName())
            );
            ids.categories.push(docs[0]._id);
            ids.regexps.push(docs[1]._id);
        });

        step("Modify Regexp link", async () => {
            const url = `/api/v1/regexps/${ids.regexps[0]}`;
            const targetId = ids.categories[10].toString();

            const { status } = await request.post(url)
                .send({
                    link: targetId
                }).then();
            status.should.be.not.eql(400);

            const { body } = await request.get(url).then();
            body.link._id.should.be.eql(targetId);
        });

        step("Delete Category", () => {
            const targetId = ids.categories[10].toString();
            const url = `/api/v1/categories/${targetId}`;
            return request.delete(url).then();
        });

        step("Modify Regexp link", async () => {
            const url = `/api/v1/regexps/${ids.regexps[0]}`;
            const targetId = ids.categories[8].toString();

            const { status } = await request.post(url)
                .send({
                    link: targetId
                }).then();
            status.should.be.not.eql(400);

            const { body } = await request.get(url).then();
            body.link._id.should.be.eql(targetId);
        });

        step("Modify Regexp link with other fields", async () => {
            const url = `/api/v1/regexps/${ids.regexps[0]}`;
            const targetId = ids.categories[7].toString();

            const { body } = await request.get(url).then();
            body.link = targetId;

            const { status, body: result } = await request.post(url)
                .send(body).then();
            status.should.be.not.eql(400);
        });

    });
});
