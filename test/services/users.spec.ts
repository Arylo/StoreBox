import { Model as UsersModel } from "@models/User";
import { SystemService } from "@services/system";
import { UsersService } from "@services/users";
import db = require("../helpers/database");
import { newUser } from "../helpers/database";
import { newIds, newName } from "../helpers/utils";

describe("Users Service Test Unit", () => {

    let usersSvr: UsersService;

    before(() => {
        return db.connect();
    });

    const ids = newIds();

    after(() => {
        return db.drop(ids);
    });

    beforeEach(() => {
        usersSvr = new UsersService(new SystemService());
    });

    const user = {
        name: newName(),
        pass: newName()
    };
    before(async () => {
        const doc = await newUser(user.name, user.pass);
        ids.users.push(doc._id);
    });

    it("Cant Modify Username", async () => {
        const id = ids.users[0];
        usersSvr.modify(id, { username: newName() })
            .should.be.rejected();
    });

    it("Modify nickname", async () => {
        const id = ids.users[0];
        usersSvr.modify(id, { nickname: newName() })
            .should.be.fulfilled();
    });

});
