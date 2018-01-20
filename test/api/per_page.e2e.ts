import * as faker from "faker";
import supertest = require("supertest");
import { connect, drop, newUser, newRegexp } from "../helpers/database";
import { init } from "../helpers/server";

describe("the E2E Api of display item count Per page", () => {

    let request: supertest.SuperTest<supertest.Test>;

    before(() => {
        return connect();
    });

    const ids = {
        users: [ ],
        regexps: [ ]
    };
    after(() => {
        return drop(ids);
    });

    before(async () => {
        request = await init();
    });

    before("Login", async () => {
        const user = {
            name: faker.name.firstName(),
            pass: faker.random.words()
        };
        const doc = await newUser(user.name, user.pass);
        ids.users.push(doc._id);
        await request.post("/api/v1/auth/login")
            .send({
                username: user.name, password: user.pass
            }).then();
    });

    describe("Users", () => {

        step("More than total display list # 0", async () => {
            const {
                body: result, status: status
            } = await request.get("/api/v1/users?page=3").then();
            result.should.be.an.Array().which.length(0);
        });

        step("More than total display list # 1", async () => {
            const {
                body: result, status: status
            } = await request.get("/api/v1/users?page=3").then();
            result.should.be.an.Array().which.length(0);
        });

        step("No in `perNum` choice # 0", async () => {
            const {
                body: result, status: status
            } = await request.get("/api/v1/users?perNum=30").then();
            status.should.be.eql(400);
        });

        step("No in `perNum` choice # 1", async () => {
            const {
                body: result, status: status
            } = await request.get("/api/v1/users?perNum=20").then();
            status.should.be.eql(400);
        });

        step("Add 100 Users", async () => {
            for (let i = 0; i < 100; i++) {
                const user = {
                    name: i + faker.name.firstName(),
                    pass: i + faker.random.words()
                };
                const doc = await newUser(user.name, user.pass);
                ids.users.push(doc._id);
            }
        });

        step("have 5 pages by 25 per page", async () => {
            let req;
            req = await request.get("/api/v1/users?page=1&perNum=25").then();
            req.body.should.have.length(25);
            req = await request.get("/api/v1/users?page=2&perNum=25").then();
            req.body.should.have.length(25);
            req = await request.get("/api/v1/users?page=3&perNum=25").then();
            req.body.should.have.length(25);
            req = await request.get("/api/v1/users?page=4&perNum=25").then();
            req.body.should.have.length(25);
            req = await request.get("/api/v1/users?page=5&perNum=25").then();
            req.body.length.should.have.aboveOrEqual(0);
            req = await request.get("/api/v1/users?page=6&perNum=25").then();
            req.body.should.have.length(0);
        });

        step("have 3 pages by 50 per page", async () => {
            let req;
            req = await request.get("/api/v1/users?page=1&perNum=50").then();
            req.body.should.have.length(50);
            req = await request.get("/api/v1/users?page=2&perNum=50").then();
            req.body.should.have.length(50);
            req = await request.get("/api/v1/users?page=3&perNum=50").then();
            req.body.length.should.have.aboveOrEqual(0);
            req = await request.get("/api/v1/users?page=4&perNum=50").then();
            req.body.should.have.length(0);
        });

        step("have 2 pages by 75 per page", async () => {
            let req;
            req = await request.get("/api/v1/users?page=1&perNum=75").then();
            req.body.should.have.length(75);
            req = await request.get("/api/v1/users?page=2&perNum=75").then();
            req.body.length.should.have.aboveOrEqual(0);
            req = await request.get("/api/v1/users?page=3&perNum=75").then();
            req.body.should.have.length(0);
        });

    });

    describe("Regexps", () => {

        step("More than total display list # 0", async () => {
            const {
                body: result, status: status
            } = await request.get("/api/v1/regexps?page=2").then();
            result.should.be.an.Array().which.length(0);
        });

        step("More than total display list # 1", async () => {
            const {
                body: result, status: status
            } = await request.get("/api/v1/regexps?page=3").then();
            result.should.be.an.Array().which.length(0);
        });

        step("No in `perNum` choice # 0", async () => {
            const {
                body: result, status: status
            } = await request.get("/api/v1/regexps?perNum=30").then();
            status.should.be.eql(400);
        });

        step("No in `perNum` choice # 1", async () => {
            const {
                body: result, status: status
            } = await request.get("/api/v1/regexps?perNum=20").then();
            status.should.be.eql(400);
        });

        step("Add 100 Regexps", async () => {
            for (let i = 0; i < 100; i++) {
                const regexp = {
                    name: i + faker.name.firstName(),
                    regexp: "^regexp." + i
                };
                const doc = await newRegexp(
                    regexp.name, new RegExp(regexp.regexp)
                );
                ids.regexps.push(doc._id);
            }
        });

        step("have 5 pages by 25 per page", async () => {
            let req;
            req = await request.get("/api/v1/regexps?page=1&perNum=25").then();
            req.body.should.have.length(25);
            req = await request.get("/api/v1/regexps?page=2&perNum=25").then();
            req.body.should.have.length(25);
            req = await request.get("/api/v1/regexps?page=3&perNum=25").then();
            req.body.should.have.length(25);
            req = await request.get("/api/v1/regexps?page=4&perNum=25").then();
            req.body.should.have.length(25);
            req = await request.get("/api/v1/regexps?page=5&perNum=25").then();
            req.body.length.should.have.aboveOrEqual(0);
            req = await request.get("/api/v1/regexps?page=6&perNum=25").then();
            req.body.should.have.length(0);
        });

        step("have 3 pages by 50 per page", async () => {
            let req;
            req = await request.get("/api/v1/regexps?page=1&perNum=50").then();
            req.body.should.have.length(50);
            req = await request.get("/api/v1/regexps?page=2&perNum=50").then();
            req.body.should.have.length(50);
            req = await request.get("/api/v1/regexps?page=3&perNum=50").then();
            req.body.length.should.have.aboveOrEqual(0);
            req = await request.get("/api/v1/regexps?page=4&perNum=50").then();
            req.body.should.have.length(0);
        });

        step("have 2 pages by 75 per page", async () => {
            let req;
            req = await request.get("/api/v1/regexps?page=1&perNum=75").then();
            req.body.should.have.length(75);
            req = await request.get("/api/v1/regexps?page=2&perNum=75").then();
            req.body.length.should.have.aboveOrEqual(0);
            req = await request.get("/api/v1/regexps?page=3&perNum=75").then();
            req.body.should.have.length(0);
        });
    });
});
