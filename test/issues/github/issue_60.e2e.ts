import faker = require("faker");

import {
    addCategoryAndRegexp, connect, drop
} from "../../helpers/database";
import * as files from "../../helpers/files";
import { AdminRequest, GuestRequest } from "../../helpers/request";
import { init } from "../../helpers/server";
import { newIds, newName } from "../../helpers/utils";

/**
 * Fix [Issue 60](https://github.com/BoxSystem/StoreBox-Api/issues/60)
 */
describe("Fix Issues", () => {

    let request: AdminRequest;

    before(() => {
        return connect();
    });

    const ids = newIds();

    after(() => {
        return drop(ids);
    });

    before("login", async () => {
        request = await new GuestRequest(await init(), ids).login();
    });

    describe("Github 60 [Can Add Category with exist name]", () => {

        it("Cant", async () => {
            const name = newName();
            const req1 =
                await request.post("/api/v1/categories").send({ name }).then();
            req1.status.should.be.eql(201);
            ids.categories.push(req1.body._id);
            const req2 =
                await request.post("/api/v1/categories").send({ name }).then();
            req2.status.should.be.eql(400);
        });

    });

});
