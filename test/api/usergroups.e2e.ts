import supertest = require("supertest");
import faker = require("faker");

import { Model as UserUsergroupsModel } from "@models/User-Usergroup";
import { UsersService } from "@services/users";

import {
    connect, drop, addCategoryAndRegexp
} from "../helpers/database";
import { init } from "../helpers/server";
import {
    newUsergroup, getLinkIdByUserId
} from "../helpers/database/usergroups";
import { newUser } from "../helpers/database/user";

describe("Usergroup E2E Api", () => {

    let request: supertest.SuperTest<supertest.Test>;

    before(() => {
        return connect();
    });

    const ids = {
        users: [ ],
        usergroups: [ ],
        userusergroups: [ ]
    };

    after(() => {
        return drop(ids);
    });

    before(async () => {
        request = await init();
    });

    let userSvr: UsersService;
    before(() => {
        userSvr = new UsersService();
    });

    const user = {
        username: `${faker.name.firstName()}${Math.random()}`,
        password: faker.random.words()
    };
    step("Login", async () => {
        const userDoc = await newUser(user.username, user.password);
        ids.users.push(userDoc._id);
        const groupDoc = await newUsergroup(undefined, userDoc._id);
        ids.usergroups.push(groupDoc._id);
        ids.userusergroups.push(await getLinkIdByUserId(userDoc._id));
        await request.post("/api/v1/auth/login").send(user).then();
    });

    step("New Usergroup * 2", async () => {
        for (let i = 0; i < 2; i++) {
            const url = `/api/v1/usergroups`;
            const name = `${faker.random.word()}${Math.random()}`;
            const { status, body: result } =
                await request.post(url).send({ name }).then();
            status.should.be.eql(201);
            ids.usergroups.push(result._id);
        }
    });

    step("Usergroup List", async () => {
        const url = `/api/v1/usergroups`;
        const { status, body: result } = await request.get(url).then();
        status.should.be.eql(200);
        result.total.should.aboveOrEqual(2);
        result.data.should.be.an.Array();
    });

    step("Get Usergroup Info", async () => {
        const id = ids.usergroups[ids.usergroups.length - 1];
        const url = `/api/v1/usergroups/${id}`;
        const { status, body: result } = await request.get(url).then();
        status.should.be.eql(200);
        result.users.data.should.be.an.Array();
        result.users.total.should.be.eql(0);
    });

    step("Modify Usergroup's name", async () => {
        const id = ids.usergroups[ids.usergroups.length - 1];
        const url = `/api/v1/usergroups/${id}`;
        const name = `${faker.random.word()}${Math.random()}`;
        const { status } = await request.post(url).send({ name }).then();
        status.should.be.eql(200);
        const { body: result } = await request.get(url).then();
        result.should.have.property("name", name);
    });

    step("Delete By GET", async () => {
        const id = ids.usergroups[ids.usergroups.length - 1];
        const url = `/api/v1/usergroups/${id}/delete`;
        const { status } = await request.get(url).then();
    });

    step("Delete By DELETE", async () => {
        const id = ids.usergroups[ids.usergroups.length - 2];
        const url = `/api/v1/usergroups/${id}`;
        const { status } = await request.delete(url).then();
    });

});
