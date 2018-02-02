import supertest = require("supertest");
import path = require("path");
import faker = require("faker");
import { HttpStatus } from "@nestjs/common";

import { connect, drop, addCategoryAndRegexp, newUser } from "../helpers/database";
import { uploadFile } from "../helpers/files";
import { sleep } from "../helpers/utils";
import { init, initWithAuth } from "../helpers/server";

describe("Files E2E Api", () => {

    let request: supertest.SuperTest<supertest.Test>;

    before(async () => {
        connect();
    });

    const ids = {
        users: [ ],
        regexps: [ ],
        categories: [ ],
        goods: [ ]
    };

    after(() => {
        return drop(ids);
    });

    before(async () => {
        request = await init();
    });

    const getFileUrl = (cid: string, id: string) => {
        return `/files/categories/${cid}/goods/${id}`;
    };

    const user = {
        name: faker.name.firstName(),
        pass: faker.random.words()
    };
    step("Login", async () => {
        const doc = await newUser(user.name, user.pass);
        ids.users.push(doc._id);
        await request.post("/api/v1/auth/login")
            .send({
                username: user.name, password: user.pass
            }).then();
    });

    let cid = "";
    let id = "";
    const uploadFilepath = `${__dirname}/../files/icon_pandorabox_64x64.png`;
    step("Upload File", async () => {
        const docs = await addCategoryAndRegexp(/^icon_.+64x64\.png$/);
        cid = docs[0]._id;
        const uploadInfo = await uploadFile(request, uploadFilepath);
        id = uploadInfo.body._id;
        ids.categories.push(docs[0]._id);
        ids.regexps.push(docs[1]._id);
        ids.goods.push(id);
        await sleep(50);
    });

    step("Logout", () => {
        return request.get("/api/v1/auth/logout").then();
    });

    step("Download File", async () => {
        const filename = path.basename(uploadFilepath);

        const url = getFileUrl(cid, id);
        const { status, header, body } = await request.get(url).then();

        status.should.eql(HttpStatus.OK);
        header.should.match({
            "content-disposition": new RegExp(`filename=['"]${filename}['"]`)
        });
    });

    step("Download Nonexist File", async () => {
        const cid = "5a44d78fec77afe7c8aa3eca";
        const id = "5a44d78fec77afe7c8aa3eca";
        const url = getFileUrl(cid, id);
        const result = await request.get(url).redirects(1).then();

        result.should.have.property("status", HttpStatus.NOT_FOUND);
    });

    step("Download Wrong ID File #0", async () => {
        const cid = "5a44d78fec77afe7c8aa3eca";
        const id = "1111";
        const url = getFileUrl(cid, id);
        const result = await request.get(url).redirects(1).then();

        result.should.have.property("status", HttpStatus.BAD_REQUEST);
    });

    step("Download Wrong ID File #1", async () => {
        const cid = "1111";
        const id = "5a44d78fec77afe7c8aa3eca";
        const url = getFileUrl(cid, id);
        const result = await request.get(url).redirects(1).then();

        result.should.have.property("status", HttpStatus.BAD_REQUEST);
    });

});
