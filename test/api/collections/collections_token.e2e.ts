import faker = require("faker");

import {
    connect, drop, addCategoryAndRegexp
} from "../../helpers/database";
import { init } from "../../helpers/server";
import { newIds } from "../../helpers/utils";
import { TokenRequest, GuestRequest } from "../../helpers/request";
import * as files from "../../helpers/files";

describe("Token to Upload Files Api", () => {

    let request: TokenRequest;

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
        request = await req.loginWithToken();
    });

    const FILE_COUNST = 10;
    const prefix = `${faker.random.word()}_`;
    before(async () => {
        // Generator Files
        for (let i = 0; i < FILE_COUNST; i++) {
            await request.newFile(`${prefix}${faker.random.uuid()}`);
        }
    });

    step("Add Category and Regexp", async () => {
        const docs = await addCategoryAndRegexp(
            new RegExp(`^${prefix}`)
        );
        ids.categories.push(docs[0]._id);
        ids.regexps.push(docs[1]._id);
    });

    let name = "";
    step("Upload Files", async () => {
        const {
            body: result, status
        } = await request.uploadFiles(filepaths);
        status.should.be.eql(201);
        result.should.have.properties("name", "_id", "goods");
        name = result.name;
    });

    step("Get Collection", async () => {
        const {
            body: result
        } = await request.get(`/collections/${name}`).then();
    });

});
