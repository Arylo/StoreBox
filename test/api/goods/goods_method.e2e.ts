import faker = require("faker");

import {
    addCategoryAndRegexp, connect, drop
} from "../../helpers/database";
import * as files from "../../helpers/files";
import { AdminRequest, GuestRequest } from "../../helpers/request";
import { init } from "../../helpers/server";
import { newIds, newName } from "../../helpers/utils";

describe("Check `/goods` methods", () => {

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
        request = await new GuestRequest(await init(), ids, filepaths).login();
    });

    const tags = [ newName(), newName() ];

    step("Init Env", async () => {
        await request.newFile();
        await request.addCategoryWithRegexp();
        await request.uploadFile();
        const id = ids.categories[ids.categories.length - 1];
        await request.put(`/api/v1/categories/${id}`).send({
            tags
        }).then();
    });

    step("Check Goods Method", async () => {
        const query = tags.reduce((arr, item) => {
            arr.push("tags=" + encodeURI(item));
            return arr;
        }, [ ]).join("&");
        const { status, body } = await request.get(`/goods?${query}`).then();
        status.should.be.eql(200);
        const data: any[] = body.data;
        data.should.matchEach((val) => {
            val.should.have.property("downloaded").which.is.a.Number();
            val.should.have.not.properties(["active", "hidden", "tags"]);
        });
    });

});
