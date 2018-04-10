import faker = require("faker");

import {
    connect, drop, addCategoryAndRegexp
} from "../../helpers/database";
import { init } from "../../helpers/server";
import { newIds } from "../../helpers/utils";
import { GuestRequest } from "../../helpers/request";
import * as files from "../../helpers/files";

/**
 * Fix [Issue 57](https://github.com/BoxSystem/StoreBox-Api/issues/57)
 */
describe("Fix Issues", () => {

    let request: GuestRequest;

    before(() => {
        return connect();
    });

    const ids = newIds();

    after(() => {
        return drop(ids);
    });

    before("login", async () => {
        request = await new GuestRequest(await init(), ids);
    });

    describe("Github 57 [Get `/goods` Fail]", () => {

        it("GET", async () => {
            const { status } = await request.get("/goods");
            status.should.be.not.eql(500);
            status.should.be.eql(200);
        });

    });

});
