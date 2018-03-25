import { Model as SystemModel } from "@models/System";
import supertest = require("supertest");
import {
    connect, drop
} from "../../helpers/database";
import { init } from "../../helpers/server";
import auth = require("@db/auth");
import { newName } from "../../helpers/utils";

describe("Collections E2E Api", () => {

    let request: supertest.SuperTest<supertest.Test>;

    before(() => {
        return connect();
    });

    const ids = {
        users: [ ]
    };

    after(() => {
        return drop(ids);
    });

    before(async () => {
        request = await init();
    });

    before("login", async () => {
        ids.users.push((await auth.login(request))[0]);
    });

    after(async () => {
        await SystemModel
            .findOneAndRemove({ key: "DEFAULT_GOOD_URL" })
            .exec();
        await SystemModel
            .findOneAndRemove({ key: "DEFAULT_COLLECTION_URL" })
            .exec();
    });

    it("Get System Info", async () => {
        const { status } = await request.get("/api/v1/system/info").then();
        status.should.be.eql(200);
    });

    it("Set Good Url", async () => {
        const value = `http://example.com/${newName()}/{{gid}}`;
        const { status } = await request.put("/api/v1/system/vars")
            .send({ key: "DEFAULT_GOOD_URL", value }).then();
        status.should.be.eql(200);
        const { body } = await request.get("/api/v1/system/vars").then();
        body.should.matchAny({ key: "DEFAULT_GOOD_URL", value });
    });

    it("Set Empty Good Url", async () => {
        const value = "";
        const { status } = await request.put("/api/v1/system/vars")
            .send({ key: "DEFAULT_GOOD_URL", value }).then();
        status.should.be.eql(200);
        const { body } = await request.get("/api/v1/system/vars").then();
        body.should.matchAny({ key: "DEFAULT_GOOD_URL", value });
    });

    it("Set one wrong Good Url", async () => {
        const value = `http://example.com/${newName()}`;
        const { status } = await request.put("/api/v1/system/vars")
            .send({ key: "DEFAULT_GOOD_URL", value }).then();
        status.should.be.eql(400);
        const { body } = await request.get("/api/v1/system/vars").then();
        body.should.not.matchAny({ key: "DEFAULT_GOOD_URL", value });
    });

    it("Set Collection Url", async () => {
        const value = `http://example.com/${newName()}/{{cid}}`;
        const { status } = await request.put("/api/v1/system/vars")
            .send({ key: "DEFAULT_COLLECTION_URL", value }).then();
        status.should.be.eql(200);
        const { body } = await request.get("/api/v1/system/vars").then();
        body.should.matchAny({ key: "DEFAULT_COLLECTION_URL", value });
    });

    it("Set Empty Collection Url", async () => {
        const value = "";
        const { status } = await request.put("/api/v1/system/vars")
            .send({ key: "DEFAULT_COLLECTION_URL", value }).then();
        status.should.be.eql(200);
        const { body } = await request.get("/api/v1/system/vars").then();
        body.should.matchAny({ key: "DEFAULT_COLLECTION_URL", value });
    });

    it("Set one wrong Collection Url", async () => {
        const value = `http://example.com/${newName()}`;
        const { status } = await request.put("/api/v1/system/vars")
            .send({ key: "DEFAULT_COLLECTION_URL", value }).then();
        status.should.be.eql(400);
        const { body } = await request.get("/api/v1/system/vars").then();
        body.should.not.matchAny({ key: "DEFAULT_COLLECTION_URL", value });
    });

    it("set value to non-exist key", async () => {
        const { status } = await request.put("/api/v1/system/vars")
            .send({ key: newName(), value: newName() }).then();
        status.should.be.eql(400);
    });

});
