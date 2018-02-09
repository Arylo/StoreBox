import supertest = require("supertest");
import faker = require("faker");

import {
    connect, drop, newUser
} from "../helpers/database";
import { init } from "../helpers/server";

/**
 * The Feature of Edit User
 * Fix [Issue 35](https://github.com/Arylo/StoreBox/issues/35)
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

    describe("Github 35 [The Feature of Edit User]", () => {

        const user = {
            name: faker.name.firstName(),
            pass: faker.random.words()
        };
        before("Login", async () => {
            const doc = await newUser(user.name, user.pass);
            ids.users.push(doc._id);
            await request.post("/api/v1/auth/login")
                .send({
                    username: user.name, password: user.pass
                }).then();
        });

        step("Edit User's Nickname", async () => {
            const nickname = faker.name.firstName();
            const id = ids.users[0];
            const { status } = await request.post(`/api/v1/users/${id}`)
                .send({ nickname })
                .then();
            status.should.eql(200);
            const {
                body: result
            } = await request.get(`/api/v1/users/${id}`).then();
            result.should.have.property("nickname", nickname);
        });

    });
});
