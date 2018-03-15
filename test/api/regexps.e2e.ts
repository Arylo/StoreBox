import supertest = require("supertest");

import { Model as RegexpsModel } from "@models/Regexp";
import { RegexpsService } from "@services/regexps";
import { connect, drop, newUser } from "../helpers/database";
import { init } from "../helpers/server";
import { sleep } from "../helpers/utils";
import { newName } from "./../helpers/utils";
import auth = require("../helpers/database/auth");

describe("Regexp E2E Api", () => {

    const URL = "/api/v1/regexps";
    let request: supertest.SuperTest<supertest.Test>;
    let regexpsSvr: RegexpsService;

    before(() => {
        return connect();
    });

    const ids = {
        users: [ ],
        regexps: [ ]
    };

    after(() => {
        return drop(ids);
    });

    before(async () => {
        request = await init();
    });

    before(() => {
        regexpsSvr = new RegexpsService();
    });

    before("login", async () => {
        ids.users.push((await auth.login(request))[0]);
    });

    step("Add 3 Regexps", async () => {
        const items = [{
            name: newName(),
            value: "^list.0"
        }, {
            name: newName(),
            value: "^list.1"
        }, {
            name: newName(),
            value: "^list.2"
        }];
        for (const item of items) {
            const doc = await regexpsSvr.create({
                name: item.name,
                value: item.value + Date.now()
            });
            ids.regexps.push(doc._id);
            await sleep(100);
        }
    });

    step("Get Regexp Info", async () => {
        const {
            body: result, status: status
        } = await request.get(URL).then();
    });

    step("List", async () => {
        const {
            body: result, status: status
        } = await request.get(URL).then();
        status.should.be.eql(200);
        result.data.length.should.be.aboveOrEqual(3);
        result.data.should.matchEach((item) => {
            item.should.have.properties("name", "value");
        });
    });

    step("Get Regexp", async () => {
        const {
            body: result, status: status
        } = await request.get(`${URL}/${ids.regexps[0]}`).then();
        result.should.have.properties("name", "value");
        result.should.match({ value: /^\^list\.0/ });
    });

    const data = {
        name: newName(),
        value: "^abc.ccd"
    };
    step("Add Regexp", async () => {
        const {
            body: result, status: status
        } = await request.post(URL).send(data).then();
        ids.regexps.push(result._id);
        status.should.be.eql(201);
        result.should.have.properties(data);
        const regexp = await RegexpsModel.findById(result._id).exec();
        should(regexp).be.not.an.null();
    });

    step("Add Exist Regexp", async () => {
        const {
            body: result, status: status
        } = await request.post(URL).send(data).then();
        status.should.be.eql(400);
    });

    step("Add Exist(Name Field) Regexp", async () => {
        const {
            body: result, status: status
        } = await request.post(URL).send({
            name: data.name,
            value: data.value + "1"
        }).then();
        status.should.be.eql(400);
    });

    step("Add Exist(Value Field) Regexp", async () => {
        const {
            body: result, status: status
        } = await request.post(URL).send({
            name: data.name + "1",
            value: data.value
        }).then();
        status.should.be.eql(400);
    });

    step("Modify Name", async () => {
        const raw = await RegexpsModel.addRegexp(
            newName(), new RegExp(newName()).source
        );
        ids.regexps.push(raw._id);
        const { body: result, status: status } =
            await request.post(`${URL}/${raw._id}`)
            .send({ name: "test" }).then();
        status.should.be.eql(200);
        const regexp = await RegexpsModel.findById(raw._id).exec();
        regexp.toObject().should.have.property("name", "test");
    });

    step("Modify Value", async () => {
        const oldRegexp = new RegExp(newName());
        const newRegexp = new RegExp(newName());
        const raw = await RegexpsModel.addRegexp(
            newName(), oldRegexp.source
        );
        ids.regexps.push(raw._id);
        const { body: result, status } = await request.post(`${URL}/${raw._id}`)
            .send({ value: newRegexp.source }).then();
        status.should.be.eql(200);
        const regexpDoc = await RegexpsModel.findById(raw._id).exec();
        regexpDoc.toObject().should.have.property("value", newRegexp.source);
    });

    step("Modify Exist Name", async () => {
        const raw =
            await RegexpsModel.addRegexp(newName(), "^abc.ccd$");
        ids.regexps.push(raw._id);
        const { body: result, status: status } =
            await request.post(`${URL}/${raw._id}`)
            .send({ name: data.name }).then();
        status.should.be.eql(400);
    });

    // Ignore Self Value
    xstep("Modify Exist Value", async () => {
        const data = {
            name: newName(),
            value: "^modify.exist.value"
        };
        const raw = await RegexpsModel.addRegexp(data.name, data.value);
        ids.regexps.push(raw._id);
        const { body: result, status } = await request.post(`${URL}/${raw._id}`)
            .send({ value: data.value }).then();
        status.should.be.eql(400);
    });

    xstep("Modify with Empty Param", async () => {
        const raw = await RegexpsModel.addRegexp(
            newName(), "^empty.param"
        );
        ids.regexps.push(raw._id);
        const { body: result, status: status } =
            await request.post(`${URL}/${raw._id}`).then();
        status.should.be.eql(400);
    });

    step("Delete Regexp By GET", async () => {
        const raw = await RegexpsModel.addRegexp(
            newName(), "^get.delete"
        );
        ids.regexps.push(raw._id);
        // Delete
        const { body: result, status: status } =
            await request.get(`${URL}/${raw._id}/delete`).then();
        status.should.eql(200);
        const regexp = await RegexpsModel.findById(raw._id).exec();
        should(regexp).be.an.null();
    });

    step("Delete Regexp By DELETE", async () => {
        const raw = await RegexpsModel.addRegexp(
            newName(), "^delete.delete"
        );
        ids.regexps.push(raw._id);
        // Delete
        const { body: result, status: status } =
            await request.delete(`${URL}/${raw._id}`).then();
        status.should.eql(200);
        const regexp = await RegexpsModel.findById(raw._id).exec();
        should(regexp).be.an.null();
    });

});
