import supertest = require("supertest");
import faker = require("faker");

import {
    connect, drop, newUser, addCategoryAndRegexp
} from "../helpers/database";
import { init } from "../helpers/server";

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
            name: faker.name.firstName(),
            pass: faker.random.words(),
            id: ""
        };
        step("Login", async () => {
            const doc = await newUser(user.name, user.pass);
            ids.users.push(doc._id);
            await request.post("/api/v1/auth/login")
                .send({
                    username: user.name, password: user.pass
                }).then();
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
            name: faker.name.firstName(),
            pass: faker.random.words(),
            id: ""
        };
        step("Login", async () => {
            const doc = await newUser(user.name, user.pass);
            ids.users.push(doc._id);
            user.id = doc._id;
            await request.post("/api/v1/auth/login")
                .send({
                    username: user.name, password: user.pass
                }).then();
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
