import { connect, drop } from "../../helpers/database";
import { init } from "../../helpers/server";
import { newIds } from "../../helpers/utils";
import { GuestRequest, AdminRequest } from "../../helpers/request";
import * as files from "../../helpers/files";

describe("Get Good List By Category ID", () => {

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

    before("login", async () => {
        const req = await new GuestRequest(await init(), ids, filepaths);
        request = await req.login();
    });

    step(("Init Env"), async () => {
        await request.newFile();
        await request.addCategoryWithRegexp();
        await request.uploadFile();
        await request.newFile();
        await request.addCategoryWithRegexp();
        await request.uploadFile();
    });

    step("Checker Number", async () => {
        const url = "/api/v1/goods";
        const { body: result0 } = await request.get(url).then();
        result0.should.have.property("total", 2);
        const cid = ids.categories[ids.categories.length - 1];
        const { body: result1 } = await request.get(`${url}?cid=${cid}`).then();
        result1.should.have.property("total", 1);
    });

});
