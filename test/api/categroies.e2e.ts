import supertest = require("supertest");
import faker = require("faker");

import { connect, drop, newUser } from "../helpers/database";
import { init } from "../helpers/server";
import { login } from "../helpers/database/auth";

describe("Categories E2E Api", () => {

    let request: supertest.SuperTest<supertest.Test>;

    before(() => {
        return connect();
    });

    const ids = {
        users: [ ],
        categories: [ ],
        values: [ ]
    };

    after(() => {
        return drop(ids);
    });

    before(async () => {
        request = await init();
    });

    step("login", async () => {
        ids.users.push((await login(request))[0]);
    });

    step("Add Category", async () => {
        const ctx = {
            name: faker.name.firstName()
        };
        const { body: result } = await request.post("/api/v1/categories")
            .send(ctx)
            .then();
        ids.categories.push(result._id);
        result.should.have.properties({
            name: ctx.name,
            attributes: [ ],
            tags: [ ]
        });
    });

    step("Add Category with Tags", async () => {
        const ctx = {
            name: faker.name.firstName(),
            tags: [
                faker.random.words(),
                faker.random.words(),
                faker.random.words()
            ]
        };
        const { body: result } = await request.post("/api/v1/categories")
            .send(ctx)
            .then();
        ids.categories.push(result._id);
        result.should.have.properties({
            name: ctx.name,
            attributes: [ ],
            tags: ctx.tags
        });
    });

    step("Add Category with Attributes", async () => {
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
        const { body: result } = await request.post("/api/v1/categories")
            .send(ctx)
            .then();
        ids.categories.push(result._id);
        for (const attrId of result.attributes) {
            ids.values.push(attrId);
        }
        result.should.have.properties({
            name: ctx.name,
            tags: [ ]
        });
        result.attributes.should.be.an.Array()
            .which.length(3);
    });

});
