import supertest = require("supertest");
import faker = require("faker");

import {
    connect, drop, newUser, addCategoryAndRegexp
} from "../helpers/database";
import { init } from "../helpers/server";

/**
 * About [Issus 21](https://github.com/Arylo/StoreBox/issues/21)
 */
describe("Fix Issuses", () => {

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

    describe("Github 21", () => {

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

        step("Goods List status code is 200", async () => {
            for (let i = 1; i <= 100; i++) {
                const url = `/api/v1/goods?perNum=${i}&page=1`;
                const {
                    body: result, status
                } = await request.get(url)
                    .send({
                        username: user.name, password: user.pass
                    }).then();
                status.should.be.eql(200);
            }
        });

        step("Regexps List status code is 200", async () => {
            for (let i = 1; i <= 100; i++) {
                const url = `/api/v1/regexps?perNum=${i}&page=1`;
                const {
                    body: result, status
                } = await request.get(url)
                    .send({
                        username: user.name, password: user.pass
                    }).then();
                status.should.be.eql(200);
            }
        });

        step("Users List status code is 200", async () => {
            for (let i = 1; i <= 100; i++) {
                const url = `/api/v1/users?perNum=${i}&page=1`;
                const {
                    body: result, status
                } = await request.get(url)
                    .send({
                        username: user.name, password: user.pass
                    }).then();
                status.should.be.eql(200);
            }
        });

    });

});
