import supertest = require("supertest");
import { connect, drop } from "../helpers/database";
import faker = require("faker");

import { init } from "../helpers/server";

describe("Categroies Api", () => {

    let request: supertest.SuperTest<supertest.Test>;

    before(() => {
        return connect();
    });

    after(() => {
        return drop();
    });

    before(async () => {
        request = await init();
    });

    it("Add Categroy", async () => {
        const ctx = {
            name: faker.name.firstName()
        };
        const { body: result } = await request.post("/categroies")
            .send(ctx)
            .then();
        result.should.have.properties({
            name: ctx.name,
            attributes: [ ],
            tags: [ ]
        });
    });

    it("Add Categroy with Tags", async () => {
        const ctx = {
            name: faker.name.firstName(),
            tags: [
                faker.random.words(),
                faker.random.words(),
                faker.random.words()
            ]
        };
        const { body: result } = await request.post("/categroies")
            .send(ctx)
            .then();
        result.should.have.properties({
            name: ctx.name,
            attributes: [ ],
            tags: ctx.tags
        });

    });

    it("Add Categroy with Attributes", async () => {
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
        const { body: result } = await request.post("/categroies")
            .send(ctx)
            .then();
        result.should.have.properties({
            name: ctx.name,
            tags: [ ]
        });
        result.attributes.should.be.an.Array()
            .which.length(3);
    });

});
