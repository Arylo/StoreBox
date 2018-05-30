import supertest = require("supertest");

import { Model as TokensModel } from "@models/Token";
import { connect, drop, newUser } from "../helpers/database";
import { init } from "../helpers/server";
import { newIds, newName } from "../helpers/utils";

describe("Token E2E Api", () => {

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

    const user = {
        name: newName(),
        pass: newName(),
        id: "",
        token: ""
    };
    step("Login", async () => {
        const doc = await newUser(user.name, user.pass);
        ids.users.push(doc._id);
        user.id = doc._id;
        const {
            body: result
        } = await request.post("/api/v1/auth/login?token=true")
            .send({
                username: user.name, password: user.pass
            }).then();
        result.should.have.property("token");
        ids.tokens.push(
            (await TokensModel.findOne({ token: result.token }).exec())._id
        );
        user.token = result.token;
    });

    step("Logout", () => {
        return request.post("/api/v1/auth/logout").then();
    });

    step("fill 25 tokens", async () => {
        let count = await TokensModel.count({ user: user.id }).exec();
        for (let i = count; i < 25; i++) {
            const {
                body: result
            } = await request.post("/api/v1/auth/login?token=true")
                .send({
                    username: user.name, password: user.pass
                }).then();
            result.should.have.property("token");
            ids.tokens.push(
                (await TokensModel.findOne({ token: result.token }).exec())._id
            );
        }
        count = await TokensModel.count({ user: user.id }).exec();
        count.should.be.eql(25);
    });

    step("Login Fail, Because fill tokens", async () => {
        const {
            status, body
        } = await request.post("/api/v1/auth/login?token=true")
        .send({
            username: user.name, password: user.pass
        }).then();
        status.should.be.eql(400);
    });

    step("Logout with token", async () => {
        const {
            status
        } = await request.get("/api/v1/auth/logout")
            .auth(user.name, user.token).then();
        status.should.be.eql(200);
        const count = await TokensModel.count({ user: user.id }).exec();
        count.should.be.eql(24);
    });

});
