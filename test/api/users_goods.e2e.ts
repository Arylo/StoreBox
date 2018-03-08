import supertest = require("supertest");

import {
    connect, drop, newUser, addCategoryAndRegexp
} from "../helpers/database";
import { init } from "../helpers/server";
import auth = require("@db/auth");
import { newName } from "../helpers/utils";

describe("User's Goods E2E Api", () => {

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

    describe("Self Goods", () => {

        const user = {
            name: newName(),
            pass: newName(),
            id: ""
        };

        before("login", async () => {
            const id = (await auth.login(request, user.name, user.pass))[0];
            ids.users.push(id);
            user.id = id;
        });

        step("Status Code isnt 500", async () => {
            const url = `/api/v1/users/goods?page=1&perNum=25`;
            const {
                body: result, status
            } = await request.get(url).send({
                username: user.name, password: user.pass
            }).then();
            status.should.be.not.eql(500);
            result.data.should.be.an.Array();
        });
    });

    describe("User's Goods", () => {

        const user = {
            name: newName(),
            pass: newName(),
            id: ""
        };

        before("login", async () => {
            const id = (await auth.login(request, user.name, user.pass))[0];
            ids.users.push(id);
            user.id = id;
        });

        step("Status Code isnt 500", async () => {
            const url = `/api/v1/users/${user.id}/goods?page=1&perNum=25`;
            const {
                body: result, status
            } = await request.get(url).send({
                username: user.name, password: user.pass
            }).then();
            status.should.be.not.eql(500);
            result.data.should.be.an.Array();
        });

    });

});
