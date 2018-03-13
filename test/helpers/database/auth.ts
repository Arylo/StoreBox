import supertest = require("supertest");
import { newUser } from "@db/user";
import { newName } from "../utils";

export const login = async (
    request: supertest.SuperTest<supertest.Test>,
    username = newName(),
    password = newName()
) => {
    const doc = await newUser(username, password);
    await request.post("/api/v1/auth/login")
        .send({
            username, password
        }).then();
    return [ doc._id ];
};
