import { connect, drop } from "../../helpers/database";
import { AdminRequest, GuestRequest } from "../../helpers/request";
import { init } from "../../helpers/server";
import { newIds, newName } from "../../helpers/utils";

describe("Categories Loop E2E Api", () => {

    let request: AdminRequest;

    before(() => {
        return connect();
    });

    const ids = newIds();

    after(() => {
        return drop(ids);
    });

    before(async () => {
        request = await new GuestRequest(await init(), ids).login();
    });

    before(async () => {
        await request.addCategories();
    });

    step("Parent Category cant the child category", async () => {
        const url = `/api/v1/categories/${ids.categories[2]}`;
        const content = {
            pid: ids.categories[6]
        };
        const { status } = await request.put(url).send(content).then();
        status.should.be.eql(400);
    });

    step("Use other parent category", async () => {
        const url = `/api/v1/categories/${ids.categories[6]}`;
        const content = {
            pid: ids.categories[2]
        };
        const { status } = await request.put(url).send(content).then();
        status.should.be.eql(200);
    });

});
