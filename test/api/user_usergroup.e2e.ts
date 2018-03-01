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

describe("User's Usergroup E2E Api", () => {

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

    step("Move Usergroup", async () => {
        const groupDoc = await newUsergroup();
        ids.usergroups.push(groupDoc._id);
        const url = `/api/v1/users/${ids.users[0]}/usergroup/${groupDoc._id}`;
        const { status, body: result } = await request.get(url).then();
        status.should.be.eql(200);
        const group = await userSvr.getUsergroup(ids.users[0]);
        group._id.toString().should.be.eql(groupDoc._id.toString());
        group._id.toString().should.be.not.eql(ids.usergroups[0].toString());
    });

});
