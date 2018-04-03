import { connect, drop } from "../../helpers/database";
import { init } from "../../helpers/server";
import { newName, newIds } from "../../helpers/utils";
import { AdminRequest, GuestRequest } from "../../helpers/request";
import { addQuery } from "../../helpers/files";

describe("Good List By Tags E2E Api", () => {

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

    const cateStartPoint = 1;
    before("Add Categories", async () => {
        await request.addCategory();
        await request.addCategories(ids.categories[0]);
    });

    step("Add Tags", async () => {
        for (let i = 0; i < 11; i++) {
            const url =
                `/api/v1/categories/${ids.categories[i + cateStartPoint]}`;
            await request.put(url).send({ tags: [ `${i}` ] }).then();
        }
        const url = `/api/v1/categories/${ids.categories[0]}`;
        await request.put(url).send({ tags: [ "9999" ] }).then();
    });

    step("Upload Files to Cateogories", async () => {
        // 2 Goods To ID2
        for (let i = 0; i < 2; i++) {
            await request.newFile();
            await request.addCategoryWithRegexp(
                undefined, ids.categories[cateStartPoint + 2]
            );
            await request.uploadFile();
        }
        // 4 Goods To ID7
        for (let i = 0; i < 4; i++) {
            await request.newFile();
            await request.addCategoryWithRegexp(
                undefined, ids.categories[cateStartPoint + 7]
            );
            await request.uploadFile();
        }
        // 1 Goods To ID9
        for (let i = 0; i < 1; i++) {
            await request.newFile();
            await request.addCategoryWithRegexp(
                undefined, ids.categories[cateStartPoint + 9]
            );
            await request.uploadFile();
        }
    });

    step("Good List By Tags # 0", async () => {
        const url = addQuery("/goods", { query: { tags: "0" } });
        const { body } = await request.get(url).then();
        body.should.have.property("total", 6);
    });

    step("Good List By Tags # 1", async () => {
        const url = addQuery("/goods", { query: { tags: "9999" } });
        const { body } = await request.get(url).then();
        body.should.have.property("total", 7);
    });

    step("Good List By Tags # 2", async () => {
        const url = addQuery("/goods", { query: { tags: "9999 0" } });
        const { body } = await request.get(url).then();
        body.should.have.property("total", 6);
    });

});
