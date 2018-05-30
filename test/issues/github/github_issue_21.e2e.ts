import supertest = require("supertest");

import auth = require("@db/auth");
import {
    addCategoryAndRegexp, connect, drop, newUser
} from "../../helpers/database";
import { init } from "../../helpers/server";
import { newIds, newName } from "../../helpers/utils";

/**
 * About [Issue 21](https://github.com/BoxSystem/StoreBox-Api/issues/21)
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

    describe("Github 21", () => {

        const user = {
            name: newName(),
            pass: newName()
        };
        before("login", async () => {
            ids.users.push(
                (await auth.login(request, user.name, user.pass))[0]
            );
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
