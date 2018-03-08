import supertest = require("supertest");
import faker = require("faker");
import { newUser } from "./user";

export const login = async (
    request: supertest.SuperTest<supertest.Test>,
    username = `${faker.name.firstName()}${Math.random()}`,
    password = `${faker.random.words()}${Math.random()}`,
) => {
    const doc = await newUser(username, password);
    await request.post("/api/v1/auth/login")
        .send({
            username, password
        }).then();
    return [ doc._id ];
};
