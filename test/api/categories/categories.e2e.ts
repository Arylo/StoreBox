import { newIds } from "../../helpers/utils";
import supertest = require("supertest");

import { connect, drop, newUser } from "../../helpers/database";
import { init } from "../../helpers/server";
import { login } from "../../helpers/database/auth";
import { newName } from "../../helpers/utils";

describe("Categories E2E Api", () => {

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

    step("login", async () => {
        ids.users.push((await login(request))[0]);
    });

    step("Add Category", async () => {
        const ctx = {
            name: newName()
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
            name: newName(),
            tags: [
                newName(),
                newName(),
                newName()
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
            name: newName(),
            attributes: [
                {
                    key: newName(),
                    value: newName()
                }, {
                    key: newName(),
                    value: newName()
                }, {
                    key: newName(),
                    value: newName()
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
