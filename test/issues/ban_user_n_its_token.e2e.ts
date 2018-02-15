import supertest = require("supertest");
import faker = require("faker");

import { connect, drop, newUser } from "../helpers/database";
import { init } from "../helpers/server";
import { UsersService } from "@services/users";
import { TokensService } from "@services/tokens";

describe("Fix Issues", () => {

    let request: supertest.SuperTest<supertest.Test>;
    const tokensSvr = new TokensService();
    const usersSvr = new UsersService();

    before(() => {
        return connect();
    });

    const ids = {
        users: [ ],
        tokens: [ ]
    };

    after(() => {
        return drop(ids);
    });

    before(async () => {
        request = await init();
    });

    const user = {
        name: faker.name.firstName(),
        pass: faker.random.words(),
        token: ""
    };
    describe("Token Action When User ban", () => {

        step("Login", async () => {
            const doc = await newUser(user.name, user.pass);
            ids.users.push(doc._id);
            const {
                body: result
            } = await request.post("/api/v1/auth/login?token=true")
                .send({
                    username: user.name, password: user.pass
                }).then();
            result.should.have.property("token");
            ids.tokens.push(await tokensSvr.getIdByToken(result.token));
            user.token = result.token;
        });

        step("Get Goods Success By Token", async () => {
            const { status } = await request.get("/api/v1/users/goods")
            .auth(user.name, user.token).then();
            status.should.be.eql(200);
        });

        step("Ban User", () => {
            return usersSvr.modify(ids.users[0], { active: false });
        });

        step("Get Goods Fail By Token", async () => {
            const { status } = await request.get("/api/v1/users/goods")
                .auth(user.name, user.token).then();
            status.should.be.eql(403);
        });

        step("Allow User", () => {
            return usersSvr.modify(ids.users[0], { active: true });
        });

        step("Get Goods Fail By Token", async () => {
            const { status } = await request.get("/api/v1/users/goods")
                .auth(user.name, user.token).then();
            status.should.be.eql(200);
        });

    });

});
