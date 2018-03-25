import supertest = require("supertest");
import {
    connect, drop, newUser, newRegexp, newCategory
} from "../helpers/database";
import { init } from "../helpers/server";
import auth = require("@db/auth");
import { newName, newIds } from "../helpers/utils";

describe("the E2E Api of display item count Per page", () => {

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

    before("login", async () => {
        ids.users.push((await auth.login(request))[0]);
    });

    describe("Users", () => {

        const URL = "/api/v1/users";

        after(() => {
            return drop(ids);
        });

        step("More than total display list # 0", async () => {
            const {
                body: result, status: status
            } = await request.get(`${URL}?page=3`).then();
            result.data.should.be.an.Array().which.length(0);
        });

        step("More than total display list # 1", async () => {
            const {
                body: result, status: status
            } = await request.get(`${URL}?page=3`).then();
            result.data.should.be.an.Array().which.length(0);
        });

        xstep("No in `perNum` choice # 0", async () => {
            const {
                body: result, status: status
            } = await request.get(`${URL}?perNum=30`).then();
            status.should.be.eql(400);
        });

        xstep("No in `perNum` choice # 1", async () => {
            const {
                body: result, status: status
            } = await request.get(`${URL}?perNum=20`).then();
            status.should.be.eql(400);
        });

        step("Add 100 Users", async () => {
            for (let i = 0; i < 100; i++) {
                const user = {
                    name: newName(),
                    pass: newName()
                };
                const doc = await newUser(user.name, user.pass);
                ids.users.push(doc._id);
            }
        });

        step("have 4 pages by 25 per page", async () => {
            let req;
            // Page 1
            req = await request.get(`${URL}?page=1&perNum=25`).then();
            req.body.totalPages.should.have.aboveOrEqual(4);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(25);
            // Page 2
            req = await request.get(`${URL}?page=2&perNum=25`).then();
            req.body.totalPages.should.have.aboveOrEqual(4);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(25);
            // Page 3
            req = await request.get(`${URL}?page=3&perNum=25`).then();
            req.body.totalPages.should.have.aboveOrEqual(4);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(25);
            // Page 4
            req = await request.get(`${URL}?page=4&perNum=25`).then();
            req.body.totalPages.should.have.aboveOrEqual(4);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(25);
            // Page 5
            req = await request.get(`${URL}?page=5&perNum=25`).then();
            req.body.totalPages.should.have.aboveOrEqual(4);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.length.should.have.aboveOrEqual(0);
            // Page 6
            req = await request.get(`${URL}?page=6&perNum=25`).then();
            req.body.totalPages.should.have.aboveOrEqual(4);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(0);
        });

        step("have 2 pages by 50 per page", async () => {
            let req;
            // Page 1
            req = await request.get(`${URL}?page=1&perNum=50`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(50);
            // Page 2
            req = await request.get(`${URL}?page=2&perNum=50`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(50);
            // Page 3
            req = await request.get(`${URL}?page=3&perNum=50`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.length.should.have.aboveOrEqual(0);
            // Page 4
            req = await request.get(`${URL}?page=4&perNum=50`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(0);
        });

        step("have 2 pages by 75 per page", async () => {
            let req;
            // Page 1
            req = await request.get(`${URL}?page=1&perNum=75`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(75);
            // Page 2
            req = await request.get(`${URL}?page=2&perNum=75`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.length.should.have.aboveOrEqual(25);
            // Page 3
            req = await request.get(`${URL}?page=3&perNum=75`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(0);
        });

    });

    describe("Regexps", () => {

        const URL = "/api/v1/regexps";

        after(() => {
            return drop(ids);
        });

        step("More than total display list # 0", async () => {
            const {
                body: result, status: status
            } = await request.get(`${URL}?page=2`).then();
            result.data.should.have.length(0);
        });

        step("More than total display list # 1", async () => {
            const {
                body: result, status: status
            } = await request.get(`${URL}?page=3`).then();
            result.data.should.have.length(0);
        });

        xstep("No in `perNum` choice # 0", async () => {
            const {
                body: result, status: status
            } = await request.get(`${URL}?perNum=30`).then();
            status.should.be.eql(400);
        });

        xstep("No in `perNum` choice # 1", async () => {
            const {
                body: result, status: status
            } = await request.get(`${URL}?perNum=20`).then();
            status.should.be.eql(400);
        });

        step("Add 100 Regexps", async () => {
            for (let i = 0; i < 100; i++) {
                const regexp = {
                    name: newName(),
                    regexp: "^regexp." + i
                };
                const doc = await newRegexp(
                    regexp.name, new RegExp(regexp.regexp)
                );
                ids.regexps.push(doc._id);
            }
        });

        step("have 4 pages by 25 per page", async () => {
            let req;
            // Page 1
            req = await request.get(`${URL}?page=1&perNum=25`).then();
            req.body.totalPages.should.have.aboveOrEqual(4);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(25);
            // Page 2
            req = await request.get(`${URL}?page=2&perNum=25`).then();
            req.body.totalPages.should.have.aboveOrEqual(4);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(25);
            // Page 3
            req = await request.get(`${URL}?page=3&perNum=25`).then();
            req.body.totalPages.should.have.aboveOrEqual(4);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(25);
            // Page 4
            req = await request.get(`${URL}?page=4&perNum=25`).then();
            req.body.totalPages.should.have.aboveOrEqual(4);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(25);
            // Page 5
            req = await request.get(`${URL}?page=5&perNum=25`).then();
            req.body.totalPages.should.have.aboveOrEqual(4);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.length.should.have.aboveOrEqual(0);
            // Page 6
            req = await request.get(`${URL}?page=6&perNum=25`).then();
            req.body.totalPages.should.have.aboveOrEqual(4);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(0);
        });

        step("have 2 pages by 50 per page", async () => {
            let req;
            // Page 1
            req = await request.get(`${URL}?page=1&perNum=50`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(50);
            // Page 2
            req = await request.get(`${URL}?page=2&perNum=50`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(50);
            // Page 3
            req = await request.get(`${URL}?page=3&perNum=50`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.length.should.have.aboveOrEqual(0);
            // Page 4
            req = await request.get(`${URL}?page=4&perNum=50`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(0);
        });

        step("have 2 pages by 75 per page", async () => {
            let req;
            // Page 1
            req = await request.get(`${URL}?page=1&perNum=75`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(75);
            // Page 2
            req = await request.get(`${URL}?page=2&perNum=75`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.length.should.have.aboveOrEqual(0);
            // Page 3
            req = await request.get(`${URL}?page=3&perNum=75`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(0);
        });
    });

    describe("Categories", () => {

        const URL = "/api/v1/categories";

        after(() => {
            return drop(ids);
        });

        step("More than total display list # 0", async () => {
            const {
                body: result, status: status
            } = await request.get(`${URL}?page=3`).then();
            result.data.should.be.an.Array().which.length(0);
        });

        step("More than total display list # 1", async () => {
            const {
                body: result, status: status
            } = await request.get(`${URL}?page=3`).then();
            result.data.should.be.an.Array().which.length(0);
        });

        xstep("No in `perNum` choice # 0", async () => {
            const {
                body: result, status: status
            } = await request.get(`${URL}?perNum=30`).then();
            status.should.be.eql(400);
        });

        xstep("No in `perNum` choice # 1", async () => {
            const {
                body: result, status: status
            } = await request.get(`${URL}?perNum=20`).then();
            status.should.be.eql(400);
        });

        step("Add 100 categories", async () => {
            for (let i = 0; i < 100; i++) {
                const cate = {
                    name: newName()
                };
                const doc = await newCategory(cate);
                ids.categories.push(doc._id);
            }
        });

        step("have 4 pages by 25 per page", async () => {
            let req;
            // Page 1
            req = await request.get(`${URL}?page=1&perNum=25`).then();
            req.body.totalPages.should.have.aboveOrEqual(4);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(25);
            // Page 2
            req = await request.get(`${URL}?page=2&perNum=25`).then();
            req.body.totalPages.should.have.aboveOrEqual(4);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(25);
            // Page 3
            req = await request.get(`${URL}?page=3&perNum=25`).then();
            req.body.totalPages.should.have.aboveOrEqual(4);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(25);
            // Page 4
            req = await request.get(`${URL}?page=4&perNum=25`).then();
            req.body.totalPages.should.have.aboveOrEqual(4);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(25);
            // Page 5
            req = await request.get(`${URL}?page=5&perNum=25`).then();
            req.body.totalPages.should.have.aboveOrEqual(4);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.length.should.have.aboveOrEqual(0);
            // Page 6
            req = await request.get(`${URL}?page=6&perNum=25`).then();
            req.body.totalPages.should.have.aboveOrEqual(4);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(0);
        });

        step("have 2 pages by 50 per page", async () => {
            let req;
            // Page 1
            req = await request.get(`${URL}?page=1&perNum=50`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(50);
            // Page 2
            req = await request.get(`${URL}?page=2&perNum=50`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(50);
            // Page 3
            req = await request.get(`${URL}?page=3&perNum=50`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.length.should.have.aboveOrEqual(0);
            // Page 4
            req = await request.get(`${URL}?page=4&perNum=50`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(0);
        });

        step("have 2 pages by 75 per page", async () => {
            let req;
            // Page 1
            req = await request.get(`${URL}?page=1&perNum=75`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(75);
            // Page 2
            req = await request.get(`${URL}?page=2&perNum=75`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.length.should.have.aboveOrEqual(25);
            // Page 3
            req = await request.get(`${URL}?page=3&perNum=75`).then();
            req.body.totalPages.should.have.aboveOrEqual(2);
            req.body.total.should.have.aboveOrEqual(100);
            req.body.data.should.have.length(0);
        });

    });

});
