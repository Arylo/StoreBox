import supertest = require("supertest");
import faker = require("faker");

import { connect, drop, newUser } from "../helpers/database";
import { init } from "../helpers/server";

describe("Categroies E2E Api", () => {

    let request: supertest.SuperTest<supertest.Test>;

    before(() => {
        return connect();
    });

    const ids = {
        users: [ ],
        categroies: [ ],
        values: [ ]
    };

    after(() => {
        return drop(ids);
    });

    before(async () => {
        request = await init();
    });

    const user = {
        name: faker.name.firstName(),
        pass: faker.random.words()
    };
    step("Login", async () => {
        const doc = await newUser(user.name, user.pass);
        ids.users.push(doc._id);
        await request.post("/api/v1/auth/login")
            .send({
                username: user.name, password: user.pass
            }).then();
    });

    step("Add Categroy", async () => {
        const ctx = {
            name: faker.name.firstName()
        };
        const { body: result } = await request.post("/api/v1/categroies")
            .send(ctx)
            .then();
        ids.categroies.push(result._id);
        result.should.have.properties({
            name: ctx.name,
            attributes: [ ],
            tags: [ ]
        });
    });

    step("Add Categroy with Tags", async () => {
        const ctx = {
            name: faker.name.firstName(),
            tags: [
                faker.random.words(),
                faker.random.words(),
                faker.random.words()
            ]
        };
        const { body: result } = await request.post("/api/v1/categroies")
            .send(ctx)
            .then();
        ids.categroies.push(result._id);
        result.should.have.properties({
            name: ctx.name,
            attributes: [ ],
            tags: ctx.tags
        });
    });

    step("Add Categroy with Attributes", async () => {
        const ctx = {
            name: faker.name.firstName(),
            attributes: [
                {
                    key: faker.random.words(),
                    value: faker.random.words()
                }, {
                    key: faker.random.words(),
                    value: faker.random.words()
                }, {
                    key: faker.random.words(),
                    value: faker.random.words()
                }
            ].map((item) => JSON.stringify(item))
        };
        const { body: result } = await request.post("/api/v1/categroies")
            .send(ctx)
            .then();
        ids.categroies.push(result._id);
        for (const attr of result.attributes) {
            ids.values.push(attr._id);
        }
        result.should.have.properties({
            name: ctx.name,
            tags: [ ]
        });
        result.attributes.should.be.an.Array()
            .which.length(3);
    });

});
