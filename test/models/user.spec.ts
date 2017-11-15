import * as db from "../../src/db";
import * as md5 from "md5";
import * as Rx from "rxjs";
import { Model as UsersModel } from "@models/User";
import { Observer, Observable } from "rxjs";

describe("User Model", () => {

    const user = {
        username: md5(Date.now() + ""),
        password: md5(Date.now() + ""),
        id: ""
    };

    before(() => {
        db.connect();
    });

    after(() => {
        db.disconnect();
    });

    beforeEach(() => {
        return UsersModel.addUser(user.username, user.password)
            .then((result) => {
                user.id = result._id.toString();
            });
    });

    afterEach(() => {
        return UsersModel.removeUser(user.id);
    });

    it("User List", () => {
        return UsersModel.list().then((results) => {
            results.should.be.an.Array();
        });
    });

    it("Add User and use same username", () => {
        return UsersModel.addUser(user.username, "test")
            .then(null, (result: object) => {
                result.should.have.property("code", 11000);
            });
    });

    it("Add User", (done) => {
        const user = {
            username: md5(Date.now() + ""),
            password: md5(Date.now() + ""),
            id: ""
        };
        const noticer = new Rx.Subject();
        UsersModel.addUser(user.username, user.password)
            .then((result) => {
                user.id = result._id;
                noticer.next(result);
            });
        noticer.subscribe({
            next: () => {
                UsersModel.findOne({ username: user.username }).exec()
                    .then((result) => {
                        should(result).be.not.empty();
                        const obj = result.toObject();
                        obj.should.have
                            .property("username", user.username);
                        obj.should.have.not
                            .property("password", user.password);
                        noticer.complete();
                    });
            },
            complete: () => {
                UsersModel.removeUser(user.id);
                done();
            }
        });
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

    it("Ban User", () => {
        return UsersModel.ban(user.id).then((result) => {
            result.should.be.not.empty();
        });
    });

    it("Release Ban User", () => {
        return UsersModel.allow(user.id).then((result) => {
            result.should.be.not.empty();
        });
    });

    it("Login", () => {
        return UsersModel.isVaild(user.username, user.password)
            .then((result) => {
                result.should.be.not.empty();
            });
    });

    it("Login which unexist user", () => {
        const str = md5(Date.now() + "");
        return UsersModel.isVaild(str, str).then(null, (result) => {
            should(result).be.not.empty();
        });
    });

    it("Login which use wrong password", () => {
        const pass = user.password.replace(/[0-5]/g, "0");
        return UsersModel.isVaild(user.username, pass).then(null, (result) => {
            should(result).be.not.empty();
        });
    });

});
