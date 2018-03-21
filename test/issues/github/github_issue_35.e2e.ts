import supertest = require("supertest");

import {
    connect, drop, newUser
} from "../../helpers/database";
import { init } from "../../helpers/server";
import auth = require("@db/auth");
import { newName } from "../../helpers/utils";

/**
 * The Feature of Edit User
 * Fix [Issue 35](https://github.com/BoxSystem/StoreBox-Api/issues/35)
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

        before("login", async () => {
            ids.users.push((await auth.login(request))[0]);
        });

        step("Edit User's Nickname", async () => {
            const nickname = newName();
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
