import path = require("path");
import { HttpStatus } from "@nestjs/common";

import { connect, drop } from "../../helpers/database";
import * as files from "../../helpers/files";
import { sleep, newIds } from "../../helpers/utils";
import { init } from "../../helpers/server";
import { AdminRequest, GuestRequest } from "../../helpers/request";

describe("Files E2E Api", () => {

    let request: AdminRequest;

    before(async () => {
        connect();
    });

    const ids = newIds();

    after(() => {
        return drop(ids);
    });

    before("login", async () => {
        const req = new GuestRequest(await init(), ids, filepaths);
        request = await req.login();
    });

    const filepaths = [ ];

    after(() => {
        return files.remove(filepaths);
    });

    const getFileUrl = (cid: string, id: string) => {
        return `/files/categories/${cid}/goods/${id}`;
    };

    let cid = "";
    let id = "";
    const uploadFilepath = `${__dirname}/../../files/icon_pandorabox_64x64.png`;
    step("Upload File", async () => {
        const docs = await request.addCategoryWithRegexp(/^icon_.+64x64\.png$/);
        cid = ids.categories[ids.categories.length - 1].toString();
        const { status } = await request.uploadFile(uploadFilepath);
        id = ids.goods[ids.goods.length - 1].toString();
        status.should.be.eql(201);
        await sleep(50);
    });

    step("Logout", () => {
        return request.logout();
    });

    step("Download File", async () => {
        const filename = path.basename(uploadFilepath);

        const { status, header, body } =
            await request.downloadFile(cid, id);

        status.should.eql(HttpStatus.OK);
        header.should.match({
            "content-disposition": new RegExp(`filename=['"]${filename}['"]`)
        });
    });

    step("Download Nonexist File", async () => {
        const cid = "5a44d78fec77afe7c8aa3eca";
        const id = "5a44d78fec77afe7c8aa3eca";
        const result = await request.downloadFile(cid, id, {
            redirects: 1
        });

        result.should.have.property("status", HttpStatus.NOT_FOUND);
    });

    step("Download Wrong ID File #0", async () => {
        const cid = "5a44d78fec77afe7c8aa3eca";
        const id = "1111";
        const result = await request.downloadFile(cid, id, {
            redirects: 1
        });

        result.should.have.property("status", HttpStatus.BAD_REQUEST);
    });

    step("Download Wrong ID File #1", async () => {
        const cid = "1111";
        const id = "5a44d78fec77afe7c8aa3eca";
        const result = await request.downloadFile(cid, id, {
            redirects: 1
        });

        result.should.have.property("status", HttpStatus.BAD_REQUEST);
    });

});
