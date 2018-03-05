import supertest = require("supertest");
import faker = require("faker");

import { Model as UserUsergroupsModel } from "@models/User-Usergroup";
import { UsersService } from "@services/users";
import { SystemService } from "@services/system";
import { UsergroupsService } from "@services/usergroups";

import { connect, drop, addCategoryAndRegexp } from "../helpers/database";
import { init } from "../helpers/server";
import { newUsergroup, getLinkIdsByUserId, getLinkIdsByUsergroupId } from "../helpers/database/usergroups";
import { newUser, newUserWithUsergroup } from "../helpers/database/user";

describe("User's Usergroup E2E Api", () => {

    let request: supertest.SuperTest<supertest.Test>;

    before(() => {
        return connect();
    });

    const ids = {
        users: [ ],
        usergroups: [ ]
    };

    after(() => {
        return drop(ids);
    });

    before(async () => {
        request = await init();
    });

    const user = {
        username: `${faker.name.firstName()}${Math.random()}`,
        password: faker.random.words()
    };
    step("Login", async () => {
        const userDoc = await newUserWithUsergroup(
            user.username, user.password
        );
        ids.users.push(userDoc._id);
        await request.post("/api/v1/auth/login").send(user).then();
    });

    step("Get Usergroup", async () => {
        const url = `/api/v1/users/${ids.users[0]}/usergroups`;
        const { status, body: result } = await request.get(url).then();
        status.should.be.eql(200);
        result.should.have.property("total", 1);
    });

    step("User Add 4 Usergroups", async () => {
        const uid = ids.users[0];
        for (let i = 0; i < 4; i++) {
            const group = await newUsergroup(undefined, uid);
            ids.usergroups.push(group._id);
        }
    });

    step("Have 5 Usergroups ", async () => {
        const url = `/api/v1/users/${ids.users[0]}/usergroups`;
        const { status, body: result } = await request.get(url).then();
        status.should.be.eql(200);
        result.should.have.property("total", 1 + ids.usergroups.length);
    });

    step("Remove one usergroup", () => {
        const uid = ids.users[0];
        const url = `/api/v1/usergroups/${ids.usergroups[0]}/remove/${uid}`;
        return request.get(url).then();
    });

    step("Have 4 Usergroups ", async () => {
        const url = `/api/v1/users/${ids.users[0]}/usergroups`;
        const { status, body: result } = await request.get(url).then();
        status.should.be.eql(200);
        result.should.have.property("total", ids.usergroups.length);
    });

});
