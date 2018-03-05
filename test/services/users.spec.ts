import { UsersService } from "@services/users";
import { SystemService } from "@services/system";
import { Model as UsersModel } from "@models/User";
import db = require("../helpers/database");
import faker = require("faker");
import { newUser } from "../helpers/database";

describe("Users Service Test Unit", () => {

    let usersSvr: UsersService;

    before(() => {
        return db.connect();
    });

    const ids = {
        users: [ ]
    };
    after(() => {
        return db.drop(ids);
    });

    beforeEach(() => {
        usersSvr = new UsersService(new SystemService());
    });

    const user = {
        name: faker.name.firstName(),
        pass: faker.random.words()
    };
    before(async () => {
        const doc = await newUser(user.name, user.pass);
        ids.users.push(doc._id);
    });

    it("Cant Modify Username", async () => {
        const id = ids.users[0];
        usersSvr.modify(id, { username: faker.name.firstName() })
            .should.be.rejected();
    });

    it("Modify nickname", async () => {
        const id = ids.users[0];
        usersSvr.modify(id, { nickname: faker.name.firstName() })
            .should.be.fulfilled();
    });

});
