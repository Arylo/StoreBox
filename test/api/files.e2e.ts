import supertest = require("supertest");
import path = require("path");
import faker = require("faker");
import { HttpStatus } from "@nestjs/common";
import { Model as UsersModel } from "@models/User";

import { connect, drop } from "../helpers/database";
import { uploadFile } from "../helpers/files";
import { addCategroyAndRegexp } from "../helpers/categroies";
import { sleep } from "../helpers/utils";
import { init, initWithAuth } from "../helpers/server";

// FIXME
// UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 1): Error: Can't set headers after they are sent.
describe.skip("Files Api", () => {

    let request: supertest.SuperTest<supertest.Test>;

    before(async () => {
        connect();
    });

    afterEach(() => {
        return drop();
    });

    before(async () => {
        request = await initWithAuth();
    });

    before(async () => {
        const user = {
            name: faker.name.firstName(),
            pass: faker.random.words()
        };
        const obj = await UsersModel.addUser(user.name, user.pass);
        const { body: result } = await request.post("/auth/login")
            .send({
                username: user.name, password: user.pass
            }).then();
    });

    const getFileUrl = (cid: string, id: string) => {
        return `/files/categories/${cid}/goods/${id}`;
    };

    it("Download File", async () => {
        const filepath = `${__dirname}/../files/icon_pandorabox_64x64.png`;
        const filename = path.basename(filepath);
        const cid = (await addCategroyAndRegexp(/^icon_.+64x64\.png$/))[0]._id;
        const id = (await uploadFile(request, filepath)).body._id;

        await sleep(1000);

        const url = getFileUrl(cid, id);
        const result = await request.get(url).redirects(2).then();

        result.should.have.property("status", HttpStatus.OK);
        result.header.should.match({
            "content-disposition": new RegExp(`filename=['"]${filename}['"]`)
        });
    });

    it("Download Nonexist File", async () => {
        const cid = "5a44d78fec77afe7c8aa3eca";
        const id = "5a44d78fec77afe7c8aa3eca";
        const url = getFileUrl(cid, id);
        const result = await request.get(url).redirects(1).then();

        result.should.have.property("status", HttpStatus.NOT_FOUND);
    });

    it("Download Wrong ID File #0", async () => {
        const cid = "5a44d78fec77afe7c8aa3eca";
        const id = "1111";
        const url = getFileUrl(cid, id);
        const result = await request.get(url).redirects(1).then();

        result.should.have.property("status", HttpStatus.BAD_REQUEST);
    });

    it("Download Wrong ID File #1", async () => {
        const cid = "1111";
        const id = "5a44d78fec77afe7c8aa3eca";
        const url = getFileUrl(cid, id);
        const result = await request.get(url).redirects(1).then();

        // console.log(result.status)
        result.should.have.property("status", HttpStatus.BAD_REQUEST);
    });

});
