import { connect, drop } from "../../helpers/database";
import { init } from "../../helpers/server";
import { newName, newIds } from "../../helpers/utils";
import { AdminRequest, GuestRequest } from "../../helpers/request";
import files = require("../../helpers/files");

describe("Tags E2E Api", () => {

    let request: AdminRequest;

    before(() => {
        return connect();
    });

    const ids = newIds();

    after(() => {
        return drop(ids);
    });

    const filepaths = [ ];
    after(() => {
        return files.remove(filepaths);
    });

    before("Account Login", async () => {
        request = await new GuestRequest(await init(), ids, filepaths).login();
    });

    const cateStartPoint = 1;
    before("Add Categories", async () => {
        await request.addCategory();
        await request.addCategories(ids.categories[0]);
    });

    const prefix = `${Date.now()}`.substr(0, 4);

    step("Add Tags", async () => {
        for (let i = 0; i < 11; i++) {
            const url =
                `/api/v1/categories/${ids.categories[i + cateStartPoint]}`;
            await request.put(url).send({ tags: [ `${prefix}${i}` ] }).then();
        }
        const url = `/api/v1/categories/${ids.categories[0]}`;
        await request.put(url).send({ tags: [ `${prefix}9999` ] }).then();
    });

    step("Upload Files to Cateogories", async () => {
        // 2 Goods To ID2
        for (let i = 0; i < 2; i++) {
            await request.newFile();
            await request.addCategoryWithRegexp(
                undefined, ids.categories[cateStartPoint + 2]
            );
            await request.uploadFile();
        }
        // 4 Goods To ID7
        for (let i = 0; i < 4; i++) {
            await request.newFile();
            await request.addCategoryWithRegexp(
                undefined, ids.categories[cateStartPoint + 7]
            );
            await request.uploadFile();
        }
        // 1 Goods To ID9
        for (let i = 0; i < 1; i++) {
            await request.newFile();
            await request.addCategoryWithRegexp(
                undefined, ids.categories[cateStartPoint + 9]
            );
            await request.uploadFile();
        }
    });

    step("Get Tag Cloud", async () => {
        const { status, body } = await request.get("/api/v1/tags/cloud").then();
        status.should.be.eql(200);
        body.should.have.property("data").which.is.an.Array();
        body.should.have.property("total").which.aboveOrEqual(12);
        const tags: string[] =
            body.data.filter((val) => new RegExp(`^${prefix}`).test(val));
        tags.should.have.length(12);
    });

    step("Tag Group List", async () => {
        const { status, body } = await request.get("/api/v1/tags").then();
        status.should.be.eql(200);
        body.should.have.property("data").which.is.an.Array();
        body.should.have.property("total").which.equal(0);
    });

    step("Add only One Tag Group", async () => {
        const { status, body } =
            await request.post("/api/v1/tags")
            .send({ name: newName(), tags: [`${prefix}0`] }).then();
        status.should.be.eql(201);
        ids.tags.push(body._id);
    });

    step("Add have two Tags Group", async () => {
        const { status, body } =
            await request.post("/api/v1/tags")
            .send({ name: newName(), tags: [`${prefix}0`, `${prefix}1`] })
            .then();
        status.should.be.eql(201);
        ids.tags.push(body._id);
    });

    step("New Tag Group List", async () => {
        const { status, body } = await request.get("/api/v1/tags").then();
        status.should.be.eql(200);
        body.should.have.property("data").which.is.an.Array();
        body.should.have.property("total").which.equal(2);
    });

    let name;
    step("Get Info", async () => {
        const url = `/api/v1/tags/${ids.tags[ids.tags.length - 1]}`;
        const { status, body } = await request.get(url).then();
        status.should.eql(200);
        name = body.name;
    });

    step("Modify", async () => {
        const url = `/api/v1/tags/${ids.tags[ids.tags.length - 1]}`;
        const { status } = await request.put(url)
            .send({ name: newName() }).then();
        status.should.eql(200);
        const {  body } = await request.get(url).then();
        body.should.have.property("name").which.not.eql(name);
    });

    step("Delete One", async () => {
        const url = `/api/v1/tags/${ids.tags[ids.tags.length - 1]}`;
        const { status } = await request.delete(url).then();
        status.should.be.eql(200);
        const { body } = await request.get("/api/v1/tags").then();
        status.should.be.eql(200);
        body.should.have.property("data").which.is.an.Array();
        body.should.have.property("total").which.equal(1);
    });

    step("Add Hidden Tag Group", async () => {
        const content = {
            name: newName(),
            tags: [`${prefix}9999`, `${prefix}7`],
            hidden: true
        };
        const { status, body } =
            await request.post("/api/v1/tags").send(content).then();
        status.should.be.eql(201);
        ids.tags.push(body._id);
    });

    step("Private Tag Group List", async () => {
        const { status, body } = await request.get("/api/v1/tags").then();
        status.should.be.eql(200);
        body.should.have.property("data").which.is.an.Array();
        body.should.have.property("total").which.eql(2);
    });

    step("Public Tag Group List", async () => {
        const { status, body } = await request.get("/tags").then();
        status.should.be.eql(200);
        body.should.have.property("data").which.is.an.Array();
        body.should.have.property("total").which.eql(1);
    });

    it("Add No Tags Fail", async () => {
        const { status } =
            await request.post("/api/v1/tags")
            .send({ name: newName() })
            .then();
        status.should.be.eql(400);
    });

    it("Add No Name Fail", async () => {
        const { status } =
            await request.post("/api/v1/tags")
            .send({ tags: [`${prefix}9999`] })
            .then();
        status.should.be.eql(400);
    });

});
