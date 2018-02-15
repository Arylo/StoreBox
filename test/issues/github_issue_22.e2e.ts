import supertest = require("supertest");
import faker = require("faker");

import {
    connect, drop, newUser, addCategoryAndRegexp
} from "../helpers/database";
import { init } from "../helpers/server";

/**
 * Fix [Issue 22](https://github.com/Arylo/StoreBox/issues/22)
 */
describe("Fix Issues", () => {

    let request: supertest.SuperTest<supertest.Test>;

    before(() => {
        return connect();
    });

    const ids = {
        users: [ ]
    };

    after(() => {
        return drop(ids);
    });

    before(async () => {
        request = await init();
    });

    describe("Github 22", () => {

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

        step("Status Code isnt 500 #0", async () => {
            const {
                body: result, status
            } = await request.get("/api/v1/goods?page=1&perNum=25")
                .send({
                    username: user.name, password: user.pass
                }).then();
            status.should.be.not.eql(500);
        });

        step("Status Code isnt 500 #1", async () => {
            const {
                body: result, status
            } = await request.get("/api/v1/goods?perNum=25&page=1")
                .send({
                    username: user.name, password: user.pass
                }).then();
            status.should.be.not.eql(500);
        });

    });

});
