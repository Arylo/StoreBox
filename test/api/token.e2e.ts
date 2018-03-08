import supertest = require("supertest");
import { TokensService } from "@services/tokens";

import { connect, drop, newUser } from "../helpers/database";
import { init } from "../helpers/server";
import { newName } from "../helpers/utils";

describe("Token E2E Test", () => {

    let request: supertest.SuperTest<supertest.Test>;
    const tokensSvr = new TokensService();

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

    const users = [{
        name: newName(),
        pass: newName(),
        id: ""
    }, {
        name: newName(),
        pass: newName(),
        id: ""
    }];

    step("Add Two Users", async () => {
        for (const user of users) {
            const doc = await newUser(user.name, user.pass);
            ids.users.push(doc._id);
            user.id = doc._id;
        }
    });

    let token = "";
    step("Login with Token by User 0", async () => {
        const user = users[0];
        const {
            body: result, status
        } = await request.post("/api/v1/auth/login?token=true")
            .send({
                username: user.name, password: user.pass
            }).then();
        ids.tokens.push(await tokensSvr.getIdByToken(result.token));
        status.should.be.eql(201);
        result.should.have.properties(["token", "id", "nickname", "username"]);
        token = result.token;
    });

    step("Only One Tokens for User 0", async () => {
        const user = users[0];
        await request.post("/api/v1/auth/login")
            .send({
                username: user.name, password: user.pass
            }).then();
        const {
            body: result, status
        } = await request.get(`/api/v1/users/${user.id}/tokens`).then();
        status.should.eql(200);
        result.data.should.be.an.Array()
            .which.have.length(1);
        result.data.should.matchEach((item) => {
            item.should.have.properties(["token", "updatedAt", "createdAt"]);
        });
        await request.get("/api/v1/auth/logout").then();
    });

    step("Nonexist Tokens for User 1", async () => {
        const user = users[1];
        await request.post("/api/v1/auth/login")
            .send({
                username: user.name, password: user.pass
            }).then();
        const {
            body: result, status
        } = await request.get(`/api/v1/users/${user.id}/tokens`).then();
        status.should.eql(200);
        result.data.should.be.an.Array()
            .which.have.length(0);
        await request.get("/api/v1/auth/logout").then();
    });

    step("Login twice with Token by User 1", async () => {
        const user = users[1];
        for (let i = 0; i < 2; i++) {
            const {
                body: result, status
            } = await request.post("/api/v1/auth/login?token=true")
                .send({
                    username: user.name, password: user.pass
                }).then();
            ids.tokens.push(await tokensSvr.getIdByToken(result.token));
        }
    });

    step("Have Two Tokens for User 1", async () => {
        const user = users[1];
        await request.post("/api/v1/auth/login")
            .send({
                username: user.name, password: user.pass
            }).then();
        const {
            body: result, status
        } = await request.get(`/api/v1/users/${user.id}/tokens`).then();
        status.should.eql(200);
        result.data.should.be.an.Array()
            .which.have.length(2);
        result.data.should.matchEach((item) => {
            item.should.have.properties(["token", "updatedAt", "createdAt"]);
        });
        await request.get("/api/v1/auth/logout").then();
    });

    step("Only One Tokens for User 0 by `/tokens`", async () => {
        const user = users[0];
        await request.post("/api/v1/auth/login")
            .send({
                username: user.name, password: user.pass
            }).then();
        const {
            body: result, status
        } = await request.get(`/api/v1/tokens`).then();
        status.should.eql(200);
        result.data.should.be.an.Array()
            .which.have.length(1);
        result.data.should.matchEach((item) => {
            item.should.have.properties(["token", "updatedAt", "createdAt"]);
        });
        await request.get("/api/v1/auth/logout").then();
    });

    step("Only One Tokens for User 0 by `/users/tokens`", async () => {
        const user = users[0];
        await request.post("/api/v1/auth/login")
            .send({
                username: user.name, password: user.pass
            }).then();
        const {
            body: result, status
        } = await request.get(`/api/v1/users/tokens`).then();
        status.should.eql(200);
        result.data.should.be.an.Array()
            .which.have.length(1);
        result.data.should.matchEach((item) => {
            item.should.have.properties(["token", "updatedAt", "createdAt"]);
        });
        await request.get("/api/v1/auth/logout").then();
    });

    step("Only Two Tokens for User 1 by `/tokens`", async () => {
        const user = users[1];
        await request.post("/api/v1/auth/login")
            .send({
                username: user.name, password: user.pass
            }).then();
        const {
            body: result, status
        } = await request.get(`/api/v1/tokens`).then();
        status.should.eql(200);
        result.data.should.be.an.Array()
            .which.have.length(2);
        result.data.should.matchEach((item) => {
            item.should.have.properties(["token", "updatedAt", "createdAt"]);
        });
        await request.get("/api/v1/auth/logout").then();
    });

    step("Only Two Tokens for User 1 by `/users/tokens`", async () => {
        const user = users[1];
        await request.post("/api/v1/auth/login")
            .send({
                username: user.name, password: user.pass
            }).then();
        const {
            body: result, status
        } = await request.get(`/api/v1/users/tokens`).then();
        status.should.eql(200);
        result.data.should.be.an.Array()
            .which.have.length(2);
        result.data.should.matchEach((item) => {
            item.should.have.properties(["token", "updatedAt", "createdAt"]);
        });
        await request.get("/api/v1/auth/logout").then();
    });

    step("Logout by User 0", async () => {
        const user = users[0];
        await request.get("/api/v1/auth/logout")
            .auth(user.name, token)
            .then();
    });

    step("Only Zero Tokens for User 0", async () => {
        const user = users[0];
        await request.post("/api/v1/auth/login")
            .send({
                username: user.name, password: user.pass
            }).then();
        const {
            body: result, status
        } = await request.get(`/api/v1/users/${user.id}/tokens`).then();
        status.should.eql(200);
        result.data.should.be.an.Array()
            .which.have.length(0);
        await request.get("/api/v1/auth/logout").then();
    });

    step("Delete Token By GET method for User 1", async () => {
        const user = users[1];
        await request.post("/api/v1/auth/login")
            .send({
                username: user.name, password: user.pass
            }).then();

        const { status } = await request.get(
            `/api/v1/tokens/${ids.tokens[1]}/delete`
        ).then();
        status.should.eql(200);

        const {
            body: result
        } = await request.get(`/api/v1/users/${user.id}/tokens`).then();
        result.data.should.be.an.Array()
            .which.have.length(1);
        await request.get("/api/v1/auth/logout").then();
    });

    step("Delete Token By DELETE method for User 1", async () => {
        const user = users[1];
        await request.post("/api/v1/auth/login")
            .send({
                username: user.name, password: user.pass
            }).then();

        const { status } = await request.delete(
            `/api/v1/tokens/${ids.tokens[2]}`
        ).then();
        status.should.eql(200);

        const {
            body: result
        } = await request.get(`/api/v1/users/${user.id}/tokens`).then();
        result.data.should.be.an.Array()
            .which.have.length(0);
        await request.get("/api/v1/auth/logout").then();
    });

});
