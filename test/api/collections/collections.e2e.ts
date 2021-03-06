import supertest = require("supertest");
import faker = require("faker");
import fs = require("fs-extra");
import { basename } from "path";
import { config } from "@utils/config";
import { Model as GoodsModels } from "@models/Good";

import {
    connect, drop, newUser, addCategoryAndRegexp
} from "../../helpers/database";
import { init } from "../../helpers/server";
import { uploadFiles } from "../../helpers/files";
import { sleep, newName, newIds } from "../../helpers/utils";
import auth = require("@db/auth");
import goodsDb = require("@db/goods");
import files = require("../../helpers/files");

describe("Collections E2E Api", () => {

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

    const FILE_COUNST = 10;
    const filepaths = [ ];
    const prefix = `${faker.random.word()}_`;
    before(async () => {
        // Generator Files
        for (let i = 0; i < FILE_COUNST; i++) {
            const filename = `${prefix}${faker.random.uuid()}`;
            const filepath = await files.newFile(filename);
            filepaths.push(filepath);
        }
    });

    after(() => {
        return files.remove(filepaths);
    });

    step("login", async () => {
        ids.users.push((await auth.login(request))[0]);
    });

    step("Add Category and Regexp", async () => {
        const docs = await addCategoryAndRegexp(
            new RegExp(`^${prefix}`)
        );
        ids.categories.push(docs[0]._id);
        ids.regexps.push(docs[1]._id);
    });

    step("Upload Files", async () => {
        const {
            body: result, status
        } = await uploadFiles(request, filepaths);
        ids.collections.push(result._id);
        status.should.be.eql(201);
        result.should.have.properties("name", "_id", "goods");
        for (const good of result.goods) {
            const originname = good.originname;
            ids.goods.push(await goodsDb.getIdByOriginname(originname));
        }
    });

    step("User's Collection List", async () => {
        const userId = ids.users[ids.users.length - 1];
        const url = `/api/v1/users/${userId}/collections`;
        const {
            body: result, status
        } = await request.get(url).then();
        status.should.be.eql(200);
        result.should.have.properties("total", "data");
        result.data.should.be.an.Array()
            .which.matchEach((d) => {
                d.should.have.properties("name", "goods", "creator");
            });
        result.total.should.eql(1);
    });

    step("Add Other User", async () => {
        const user = {
            name: newName(),
            pass: newName()
        };
        const doc = await newUser(user.name, user.pass);
        ids.users.push(doc._id);
    });

    step("Other User's Collection List", async () => {
        const userId = ids.users[ids.users.length - 1];
        const url = `/api/v1/users/${userId}/collections`;
        const {
            body: result, status
        } = await request.get(url).then();
        status.should.be.eql(200);
        result.should.have.properties("total", "data");
        result.data.should.be.an.Array()
            .which.matchEach((d) => {
                d.should.have.properties("name", "goods", "creator");
            });
        result.total.should.eql(0);
    });

    step("All Collection List", async () => {
        const {
            body: result, status
        } = await request.get("/api/v1/collections").then();
        status.should.be.eql(200);
        result.should.have.properties("total", "data");
        result.data.should.be.an.Array()
            .which.matchEach((d) => {
                d.should.have.properties("name", "goods", "creator");
            });
        result.total.should.aboveOrEqual(1);
    });

    let goods = [ ];
    step("Get Collection Info", async () => {
        const collectionId = ids.collections[ids.collections.length - 1];
        const {
            body: result, status
        } = await request.get(`/api/v1/collections/${collectionId}`).then();
        status.should.be.eql(200);
        result.should.have.properties("name", "goods", "creator");
        result.goods.data.should.be.an.Array().which.have.length(FILE_COUNST);
        goods = result.goods.data;
    });

    step("Add New Collection", async () => {
        await sleep(50);
        const goodIds = goods.filter((_, i) => i < 5)
            .reduce((arr, cur) => {
                arr.push(cur._id);
                return arr;
            }, [ ]);
        const {
            body: result, status
        } = await request.post("/api/v1/collections")
            .send({ goods: goodIds })
            .then();
        ids.collections.push(result._id);
        status.should.be.eql(201);
        result.should.have.properties("name", "_id", "goods");
    });

    step("Add New Collection With One good ID", async () => {
        await sleep(50);
        const goodIds = goods.filter((_, i) => i === 0)
            .reduce((arr, cur) => {
                arr.push(cur._id);
                return arr;
            }, [ ]);
        const {
            body: result, status
        } = await request.post("/api/v1/collections")
            .send({ goods: goodIds })
            .then();
        ids.collections.push(result._id);
        status.should.be.eql(201);
        result.should.have.properties("name", "_id", "goods");
    });

    step("Add New Collection With Name Field", async () => {
        const goodIds = goods.filter((_, i) => i === 0)
            .reduce((arr, cur) => {
                arr.push(cur._id);
                return arr;
            }, [ ]);
        const {
            body: result, status
        } = await request.post("/api/v1/collections")
            .send({ goods: goodIds, name: "testCollection" })
            .then();
        ids.collections.push(result._id);
        status.should.be.eql(201);
        result.should.have.properties("name", "_id", "goods");
    });

    step("Fail to Add New Collection With Same Name Field", async () => {
        const goodIds = goods.filter((_, i) => i === 0)
            .reduce((arr, cur) => {
                arr.push(cur._id);
                return arr;
            }, [ ]);
        const {
            body: result, status
        } = await request.post("/api/v1/collections")
            .send({ goods: goodIds, name: "testCollection" })
            .then();
        status.should.be.eql(400);
    });

    step("Again Get User's Collection List", async () => {
        const {
            body: result, status
        } = await request.get("/api/v1/users/collections").then();
        status.should.be.eql(200);
        result.should.have.properties("total", "data");
        result.data.should.be.an.Array()
            .which.matchEach((d) => {
                d.should.have.properties("name", "goods", "creator");
            });
        result.total.should.eql(4);
    });

    step("Modify Collection with name", async () => {
        const id = ids.collections[0];
        const {
            status
        } = await request.post(`/api/v1/collections/${id}`)
            .send({ name: "testCollection1" })
            .then();
        status.should.be.eql(200);
        const {
            body: result
        } = await request.get(`/api/v1/collections/${id}`)
            .then();
        result.should.have.property("name", "testCollection1");
    });

    step("Modify Collection with old name", async () => {
        const id = ids.collections[0];
        const {
            status
        } = await request.post(`/api/v1/collections/${id}`)
            .send({ name: "testCollection1" })
            .then();
        status.should.be.eql(200);
        const {
            body: result
        } = await request.get(`/api/v1/collections/${id}`)
            .then();
        result.should.have.property("name", "testCollection1");
    });

    step("Fail to Modify Collection with exist name", async () => {
        const id = ids.collections[0];
        const {
            body: result, status
        } = await request.post(`/api/v1/collections/${id}`)
            .send({ name: "testCollection" })
            .then();
        status.should.be.eql(400);
    });

    step("Modify Collection with name", async () => {
        const id = ids.collections[0];
        const goodIds = goods.filter((_, i) => i < 4)
            .reduce((arr, cur) => {
                arr.push(cur._id);
                return arr;
            }, [ ]);
        const {
            status
        } = await request.post(`/api/v1/collections/${id}`)
            .send({ goods: goodIds })
            .then();
        status.should.be.eql(200);
        const {
            body: result
        } = await request.get(`/api/v1/collections/${id}`)
            .then();
        result.goods.data.should.have.length(4);
    });

    step("Delete by DELETE METHOD", async () => {
        const id = ids.collections[0];
        const {
            status
        } = await request.delete(`/api/v1/collections/${id}`).then();
        status.should.eql(200);
        const {
            body: result
        } = await request.get("/api/v1/users/collections").then();
        result.total.should.eql(3);
    });

    step("Delete by GET METHOD", async () => {
        const id = ids.collections[1];
        const {
            status
        } = await request.get(`/api/v1/collections/${id}/delete`).then();
        status.should.eql(200);
        const {
            body: result
        } = await request.get("/api/v1/users/collections").then();
        result.total.should.eql(2);
    });

    step("Display in public url", async () => {
        const id = ids.collections[ids.collections.length - 1];
        const { body: result } =
            await request.get(`/api/v1/collections/${id}`).then();
        const { status, body } =
            await request.get(`/collections/${result.name}`).then();
        status.should.be.eql(200);
        body.should.have.property("name", result.name);
        body.should.have.property("creator").which.is.a.String();
        body.goods.should.have.property("total", result.goods.total);
    });

});
