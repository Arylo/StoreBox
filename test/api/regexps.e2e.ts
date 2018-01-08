import supertest = require("supertest");
import faker = require("faker");

import { connect, drop } from "../helpers/database";
import { init } from "../helpers/server";
import { Model as RegexpsModel } from "@models/Regexp";

describe("Categroies Api", () => {

    let request: supertest.SuperTest<supertest.Test>;

    before(() => {
        return connect();
    });

    before(() => {
        return drop();
    });

    afterEach(() => {
        return drop();
    });

    before(async () => {
        request = await init();
    });

    // FIXME Test is running asynchronous
    it.skip("List", async () => {
        const data = [{
            name: faker.random.word(),
            value: "^abc.ccd"
        }, {
            name: faker.random.word(),
            value: "^abc..ccd"
        }, {
            name: faker.random.word(),
            value: "^abc...ccd"
        }];
        await RegexpsModel.create(data);
        const {
            body: result, status: status
        } = await request.get("/api/v1/regexps").then();
        status.should.be.eql(200);
        result.should.be.length(3);
    });

    it("Add Regexp", async () => {
        const data = {
            name: faker.random.word(),
            value: "^abc.ccd"
        };
        const {
            body: result, status: status
        } = await request.post("/api/v1/regexps").send(data).then();
        status.should.be.eql(201);
        result.should.have.properties(data);
        const regexp = await RegexpsModel.findById(result._id).exec();
        should(regexp).be.not.an.null();
    });

    it("Add Exist Regexp", async () => {
        const data = {
            name: faker.random.word(),
            value: "^abc.ccd"
        };
        await RegexpsModel.addRegexp(data.name, data.value);
        const {
            body: result, status: status
        } = await request.post("/api/v1/regexps").send(data).then();
        status.should.be.eql(400);
    });

    it("Add Exist(Name Field) Regexp", async () => {
        const data = {
            name: faker.random.word(),
            value: "^abc.ccd"
        };
        await RegexpsModel.addRegexp(data.name, data.value + "1");
        const {
            body: result, status: status
        } = await request.post("/api/v1/regexps").send(data).then();
        status.should.be.eql(400);
    });

    it("Add Exist(Value Field) Regexp", async () => {
        const data = {
            name: faker.random.word(),
            value: "^abc.ccd"
        };
        await RegexpsModel.addRegexp(data.name + "1", data.value);
        const {
            body: result, status: status
        } = await request.post("/api/v1/regexps").send(data).then();
        status.should.be.eql(400);
    });

    it("Modify Name", async () => {
        const raw = await RegexpsModel.addRegexp(
            faker.random.word(), "^adb.ccd"
        );
        const { body: result, status: status } =
            await request.post(`/api/v1/regexps/${raw._id}`)
            .send({ name: "test" }).then();
        status.should.be.eql(200);
        const regexp = await RegexpsModel.findById(raw._id).exec();
        regexp.toObject().should.have.property("name", "test");
    });

    it("Modify Value", async () => {
        const raw = await RegexpsModel.addRegexp(
            faker.random.word(), "^adb.ccd"
        );
        const { body: result, status: status } =
            await request.post(`/api/v1/regexps/${raw._id}`)
            .send({ value: "^adb.ccd$" }).then();
        status.should.be.eql(200);
        const regexp = await RegexpsModel.findById(raw._id).exec();
        regexp.toObject().should.have.property("value", "^adb.ccd$");
    });

    it("Modify Exist Name", async () => {
        const data = {
            name: faker.random.word(),
            value: "^abc.ccd"
        };
        await RegexpsModel.addRegexp(data.name, data.value);
        const raw =
            await RegexpsModel.addRegexp(faker.random.word(), "^abc.ccd$");
        const { body: result, status: status } =
            await request.post(`/api/v1/regexps/${raw._id}`)
            .send({ name: data.name }).then();
        status.should.be.eql(400);
    });

    it("Modify Exist Value", async () => {
        const data = {
            name: faker.random.word(),
            value: "^abc.ccd"
        };
        await RegexpsModel.addRegexp(data.name, data.value);
        const raw =
            await RegexpsModel.addRegexp(faker.random.word(), "^abc.ccd$");
        const { body: result, status: status } =
            await request.post(`/api/v1/regexps/${raw._id}`)
            .send({ value: data.value }).then();
        status.should.be.eql(400);
    });

    it("Modify with Empty Param", async () => {
        const raw = await RegexpsModel.addRegexp(
            faker.random.word(), "^adb.ccd"
        );
        const { body: result, status: status } =
            await request.post(`/api/v1/regexps/${raw._id}`).then();
        status.should.be.eql(400);
    });

    it("Delete Regexp By GET", async () => {
        const raw = await RegexpsModel.addRegexp(
            faker.random.word(), "^adb.ccd"
        );
        // Delete
        const { body: result, status: status } =
            await request.get(`/api/v1/regexps/${raw._id}/delete`).then();
        status.should.eql(200);
        const regexp = await RegexpsModel.findById(raw._id).exec();
        should(regexp).be.an.null();
    });

    it("Delete Regexp By DELETE", async () => {
        const raw = await RegexpsModel.addRegexp(
            faker.random.word(), "^adb.ccd"
        );
        // Delete
        const { body: result, status: status } =
            await request.delete(`/api/v1/regexps/${raw._id}`).then();
        status.should.eql(200);
        const regexp = await RegexpsModel.findById(raw._id).exec();
        should(regexp).be.an.null();
    });

});
