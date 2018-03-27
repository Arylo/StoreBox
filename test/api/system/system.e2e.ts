import { Model as SystemModel } from "@models/System";
import { connect, drop } from "../../helpers/database";
import { init } from "../../helpers/server";
import auth = require("@db/auth");
import { newName, newIds } from "../../helpers/utils";
import { AdminRequest, GuestRequest } from "../../helpers/request";

describe("System E2E Api", () => {

    let request: AdminRequest;

    before(() => {
        return connect();
    });

    const ids = newIds();

    after(() => {
        return drop(ids);
    });

    before("login", async () => {
        request = await new GuestRequest(await init(), ids).login();
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
