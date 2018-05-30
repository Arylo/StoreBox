import path = require("path");
import supertest = require("supertest");

import auth = require("@db/auth");
import { addCategoryAndRegexp, connect, drop } from "../../helpers/database";
import { uploadFile } from "../../helpers/files";
import * as files from "../../helpers/files";
import { AdminRequest, GuestRequest } from "../../helpers/request";
import { init } from "../../helpers/server";
import { newIds, newName } from "../../helpers/utils";

describe("Goods E2E Api", () => {

    let request: AdminRequest;

    const user = {
        name: newName()
    };

    before(async () => {
        connect();
    });

    const ids = newIds();

    after(() => {
        return drop(ids);
    });

    const filepaths = [ ];

    after(() => {
        return files.remove(filepaths);
    });

    before("login", async () => {
        const req = new GuestRequest(await init(), ids, filepaths);
        request = await req.login(user.name);
    });

    step("Add Category", async () => {
        await request.addCategoryWithRegexp(/^icon_.+_64x64\.png$/);
    });

    let result;
    step("Upload File", async () => {
        const filepath = `${__dirname}/../../files/icon_pandorabox_64x64.png`;
        // Create
        result = await request.uploadFile(filepath);
        result = result.body;

        result.should.have.properties([
            "_id", "originname", "category", "uploader"
        ]);
        result.should.have.property("originname", path.basename(filepath));
    });

    step("Get Good Info", async () => {
        // Get
        result = await request.get(`/api/v1/goods/${result._id}`).then();
        result = result.body;
        result.should.have.properties([
            "_id", "createdAt", "updatedAt",
            "filename", "originname", "attributes", "tags", "active", "hidden",
            "category", "uploader"
        ]);
        result.category.should.have.properties([
            "_id", "name", "attributes", "tags"
        ]);
        result.uploader.should.have.properties([
            "_id", "nickname"
        ]);
        result.uploader.should.have.property("nickname", user.name);
    });

});
