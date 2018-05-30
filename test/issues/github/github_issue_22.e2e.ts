import supertest = require("supertest");

import auth = require("@db/auth");
import {
    addCategoryAndRegexp, connect, drop
} from "../../helpers/database";
import { init } from "../../helpers/server";
import { newIds, newName } from "../../helpers/utils";

/**
 * Fix [Issue 22](https://github.com/BoxSystem/StoreBox-Api/issues/22)
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

    describe("Github 22", () => {

        const user = {
            name: newName(),
            pass: newName()
        };
        before("login", async () => {
            ids.users.push(
                (await auth.login(request, user.name, user.pass))[0]
            );
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
