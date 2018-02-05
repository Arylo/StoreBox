import supertest = require("supertest");
import faker = require("faker");

import {
    connect, drop, newUser
} from "../helpers/database";
import { init } from "../helpers/server";

/**
 * Fix [Issue 28](https://github.com/Arylo/StoreBox/issues/28)
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

    describe("Github 28 [User can ban oneself]", () => {

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

        step("Ban self Fail", async () => {
            const url = `/api/v1/users/${ids.users[0]}/ban`;
            const { status } = await request.get(url).then();
            status.should.be.not.eql(200);
            status.should.be.eql(400);
        });

    });
});
