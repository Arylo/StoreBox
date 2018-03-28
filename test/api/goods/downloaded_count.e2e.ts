
import {
    connect, drop, addCategoryAndRegexp
} from "../../helpers/database";
import { init } from "../../helpers/server";
import { newIds } from "../../helpers/utils";
import { AdminRequest, GuestRequest } from "../../helpers/request";
import * as files from "../../helpers/files";
import { Model as LogsModel } from "@models/Log";
import { Model as CollectionsModel } from "@models/Collection";

describe("Good Downloaded Count Api e2e Test Unit", () => {

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
        const req = new GuestRequest(await init(), ids, filepaths);
        request = await req.login();
    });

    before("Add Category With Regexp And Upload File", async () => {
        await request.newFile();
        await request.addCategoryWithRegexp();
        await request.uploadFile();
    });

    step("Download Once", async () => {
        const cid = ids.categories[ids.categories.length - 1];
        const gid = ids.goods[ids.goods.length - 1];
        const { status } = await request.downloadFile(cid, gid);
        status.should.be.eql(200);
    });

    step("Download should be one time", async () => {
        const gid = ids.goods[ids.goods.length - 1];
        const url = `/api/v1/goods/${gid}`;
        const { status, body } = await request.get(url).then();
        status.should.be.eql(200);
        body.should.have.property("downloaded", 1);
    });

    step("Collection have the good download count", async () => {
        const gid = ids.goods[ids.goods.length - 1];
        await request.addCollection([ gid ]);
        const cid = ids.collections[ids.collections.length - 1];
        const { body } = await request.get(`/api/v1/collections/${cid}`).then();
        body.goods.data.should.matchEach((good) => {
            should(good).have.property("downloaded");
        });
    });

    step("Download Once Again", async () => {
        const cid = ids.categories[ids.categories.length - 1];
        const gid = ids.goods[ids.goods.length - 1];
        const { status } = await request.downloadFile(cid, gid);
        status.should.be.eql(200);
    });

    step("Download Info still one time", async () => {
        const gid = ids.goods[ids.goods.length - 1];
        const url = `/api/v1/goods/${gid}`;
        const { status, body } = await request.get(url).then();
        status.should.be.eql(200);
        body.should.have.property("downloaded", 1); // because the cache
    });

    step("Download should be two time", async () => {
        const gid = ids.goods[ids.goods.length - 1];
        const cond = { key: `good_${gid}`, type: "download" };
        const count = await LogsModel.count(cond).exec();
        count.should.be.eql(2);
    });

    step("Collection have the good download count", async () => {
        const gid = ids.goods[ids.goods.length - 1];
        await request.addCollection([ gid ]);
        const cid = ids.collections[ids.collections.length - 1];
        const req = await request.logout();
        const name = encodeURI(
            (await CollectionsModel.findById(cid).exec()).toObject().name
        );
        const { body } = await req.get(`/collections/${name}`).then();
        body.goods.data.should.matchEach((good) => {
            should(good).have.property("downloaded");
        });
    });

});
