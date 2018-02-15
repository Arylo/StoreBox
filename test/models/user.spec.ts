import * as db from "../helpers/database";
import * as md5 from "md5";
import { Model as UsersModel } from "@models/User";
import { Observer, Observable, Subject } from "rxjs";

describe("User Model", () => {

    const user = {
        username: "",
        password: "",
        id: ""
    };

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
        user.username = md5(Date.now() + "");
        user.password = md5(Date.now() + "");
        return UsersModel.addUser(user.username, user.password)
            .then((result) => {
                user.id = result._id.toString();
                ids.users.push(user.id);
            }).catch(console.log);
    });

    afterEach(() => {
        return UsersModel.removeUser(user.id).then(() => {
            user.id = "";
        });
    });

    it("Add User", async () => {
        const user = {
            username: md5(Date.now() + ""),
            password: md5(Date.now() + ""),
        };
        let result;
        // 添加测试用户
        result = await UsersModel.addUser(user.username, user.password);
        const id = result._id;
        ids.users.push(id);
        // 测试
        result = await UsersModel.findOne({ username: user.username }).exec();
        should(result).be.not.empty();
        const obj = result.toObject();
        obj.should.have.property("username", user.username);
        obj.should.have.not.property("password", user.password);
        // 删除测试用户
        UsersModel.removeUser(id);
    });

    it("User List", async () => {
        const results = await UsersModel.list();
        results.should.be.an.Array();
        const users = results.map((item) => item.toObject());
        users.should.be.matchAny({ username: user.username });
    });

    it("Add User and use same username", async () => {
        try {
            await UsersModel.addUser(user.username, "test");
        } catch (error) {
            error.toString().should.be.not.an.empty();
        }
    });

    it("Change Password", () => {
        return UsersModel.passwd(user.id, user.password, "test")
            .then((result) => {
                should(result).have.not.empty();
            });
    });

    it("Change Password When use wrong user id", () => {
        const id = user.id.replace(/\d/g, "0");
        return UsersModel.passwd(id, user.password, "test")
            .then(null, (result) => {
                should(result).have.not.empty();
            });
    });

    it("Change Password When use old password", () => {
        return UsersModel.passwd(user.id, user.password, user.password)
            .then(null, (result) => {
                should(result).have.not.empty();
            });
    });

    it("Change Password Whne use wrong old password", () => {
        return UsersModel.passwd(user.id, user.password + "test", "test")
            .then(null, (result) => {
                should(result).have.not.empty();
            });
    });

    it("Vaild", () => {
        return UsersModel.isVaild(user.username, user.password)
            .then((result) => {
                result.should.be.not.empty();
            });
    });

    it("Vaild which unexist user", () => {
        const str = md5(Date.now() + "");
        return UsersModel.isVaild(str, str).then(null, (result) => {
            should(result).be.not.empty();
        });
    });

    it("Vaild which use wrong password", () => {
        const pass = user.password.replace(/[0-5]/g, "0");
        return UsersModel.isVaild(user.username, pass).then(null, (result) => {
            should(result).be.not.empty();
        });
    });

});
