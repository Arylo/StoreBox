import supertest = require("supertest");

import auth = require("@db/auth");
import {
    addCategoryAndRegexp, connect, drop, newUser
} from "../../helpers/database";
import { init } from "../../helpers/server";
import { newIds } from "../../helpers/utils";

/**
 * Fix [Issue 16](https://github.com/BoxSystem/StoreBox-Api/issues/16)
 */
describe("Fix Issues", () => {

    let request: supertest.SuperTest<supertest.Test>;

    before(() => {
        return connect();
    });

    const ids = newIds();

    after(() => {
        return drop(ids);
    });

    before(async () => {
        request = await init();
    });

    describe("Github 16 [Overwrite Cache List Api]", () => {

        before("login", async () => {
            ids.users.push((await auth.login(request))[0]);
        });

        step("Add Category and Regexp", async () => {
            const docs = await addCategoryAndRegexp(/^icon_.+64x64\.png$/);
            ids.categories.push(docs[0]._id);
            ids.regexps.push(docs[1]._id);
        });

        step("Match Categories List", async () => {
            const {
                body: result, status: status
            } = await request.get("/api/v1/categories").then();
            status.should.be.eql(200);
            result.data.should.be.matchEach((item: object) => {
                item.should.have.properties([ "name", "tags" ]);
            });
        });

        step("Match Regexps List", async () => {
            const {
                body: result, status: status
            } = await request.get("/api/v1/regexps").then();
            status.should.be.eql(200);
            result.data.should.be.matchEach((item: object) => {
                item.should.have.properties([ "name", "value" ]);
            });
        });
    });
});
