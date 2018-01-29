import supertest = require("supertest");
import faker = require("faker");

import {
    connect, drop, newUser, addCategoryAndRegexp
} from "../helpers/database";
import { init } from "../helpers/server";

/**
 * Fix [Issus 16](https://github.com/Arylo/StoreBox/issues/16)
 */
describe("Fix Issuses", () => {

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

    describe("Github 16 [Overwrite Cache List Api]", () => {
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
