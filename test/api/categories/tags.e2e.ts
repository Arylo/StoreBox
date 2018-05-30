import { connect, drop } from "../../helpers/database";
import { AdminRequest, GuestRequest } from "../../helpers/request";
import { init } from "../../helpers/server";
import { newIds, newName } from "../../helpers/utils";

describe("Categories Tags E2E Api", () => {

    let request: AdminRequest;

    before(() => {
        return connect();
    });

    const ids = newIds();

    after(() => {
        return drop(ids);
    });

    before("Account Login", async () => {
        request = await new GuestRequest(await init(), ids).login();
    });

    before("Add Categories", () => {
        return request.addCategories();
    });

    describe("Setter", () => {

        step("Set One Tags", async () => {
            const url = `/api/v1/categories/${ids.categories[2]}`;
            const tags = [ newName() ];
            const content = { tags };
            const { status } = await request.put(url).send(content).then();
            status.should.be.eql(200);
            const { body } = await request.get(url).then();
            body.should.have.property("tags", tags);
        });

        step("Set Two Tags", async () => {
            const url = `/api/v1/categories/${ids.categories[2]}`;
            const tags = [ newName(), newName() ];
            const content = { tags };
            const { status } = await request.put(url).send(content).then();
            status.should.be.eql(200);
            const { body } = await request.get(url).then();
            body.should.have.property("tags", tags);
        });

        step("Set One Tags", async () => {
            const url = `/api/v1/categories/${ids.categories[2]}`;
            const tags = [ ];
            const content = { tags };
            const { status } = await request.put(url).send(content).then();
            status.should.be.eql(200);
            const { body } = await request.get(url).then();
            body.should.have.property("tags", tags);
        });

    });

    describe("Modify", () => {

        step("Set any tag", async () => {
            const url = `/api/v1/categories/${ids.categories[3]}`;
            const tags = [ newName(), newName(), newName(), newName() ];
            const content = { tags };
            const { status } = await request.put(url).send(content).then();
            status.should.be.eql(200);
            const { body } = await request.get(url).then();
            body.should.have.property("tags", tags);
        });

        step("Modify the categori's tags", async () => {
            const url = `/api/v1/categories/${ids.categories[3]}`;
            const tags = [ newName(), newName() ];
            const content = { tags };
            const { status } = await request.put(url).send(content).then();
            status.should.be.eql(200);
            const { body } = await request.get(url).then();
            body.should.have.property("tags", tags);
        });

    });

});
