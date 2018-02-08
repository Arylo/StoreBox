import supertest = require("supertest");
import faker = require("faker");
import { basename } from "path";
import fs = require("fs-extra");
import { Model as TokensModel } from "@models/Token";
import { config } from "@utils/config";
import { Model as GoodsModels } from "@models/Good";

import {
    connect, drop, newUser, addCategoryAndRegexp
} from "../helpers/database";
import { init } from "../helpers/server";
import { uploadFiles } from "../helpers/files";

describe("Token to Upload Files Api", () => {

    let request: supertest.SuperTest<supertest.Test>;

    before(() => {
        return connect();
    });

    const ids = {
        users: [ ],
        tokens: [ ],
        collections: [ ],
        categories: [ ],
        regexps: [ ]
    };

    after(() => {
        return drop(ids);
    });

    before(async () => {
        request = await init();
    });

    const FILE_COUNST = 10;
    const filepaths = [ ];
    const prefix = `${faker.random.word()}_`;
    before(() => {
        const folderpath = `${config.paths.tmp}/test`;
        if (!fs.existsSync(folderpath)) {
            fs.mkdirpSync(folderpath);
        }
        // Generator Files
        for (let i = 0; i < FILE_COUNST; i++) {
            const filepath = `${folderpath}/${prefix}${faker.random.uuid()}`;
            filepaths.push(filepath);
            fs.writeFileSync(filepath, JSON.stringify({
                data: Math.random()
            }), { encoding: "utf-8" });
        }
    });

    after(async () => {
        for (const filepath of filepaths) {
            fs.removeSync(filepath);
            const good = (await GoodsModels.findOne({
                originname: basename(filepath)
            }).exec()).toObject();
            fs.removeSync(
                `${config.paths.upload}/${good.category}/${good.filename}`
            );
            await GoodsModels.findByIdAndRemove(good._id).exec();
        }
    });

    step("Add Category and Regexp", async () => {
        const docs = await addCategoryAndRegexp(
            new RegExp(`^${prefix}`)
        );
        ids.categories.push(docs[0]._id);
        ids.regexps.push(docs[1]._id);
    });

    const user = {
        name: faker.name.firstName(),
        pass: faker.random.words(),
        token: ""
    };
    step("Login", async () => {
        const doc = await newUser(user.name, user.pass);
        ids.users.push(doc._id);
        const {
            body: result
        } = await request.post("/api/v1/auth/login?token=true")
            .send({
                username: user.name, password: user.pass
            }).then();
        result.should.have.property("token");
        ids.tokens.push(
            (await TokensModel.findOne({ token: result.token }).exec())._id
        );
        user.token = result.token;
    });

    step("Logout", () => {
        return request.post("/api/v1/auth/logout").then();
    });

    step("Upload Files", async () => {
        const {
            body: result, status
        } = await uploadFiles(request, filepaths);
        ids.collections.push(result._id);
        status.should.be.eql(201);
        result.should.have.properties("name", "_id", "goods");
    });

});
