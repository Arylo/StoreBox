import { SystemService } from "@services/system";
import { UsersService } from "@services/users";
import { connect, drop } from "../helpers/database";
import { GuestRequest, TokenRequest } from "../helpers/request";
import { init } from "../helpers/server";
import { newIds } from "../helpers/utils";

describe("Fix Issues", () => {

    let request: TokenRequest;
    const usersSvr = new UsersService(new SystemService());

    before(() => {
        return connect();
    });

    const ids = newIds();

    after(() => {
        return drop(ids);
    });

    before("Login", async () => {
        request = await new GuestRequest(await init(), ids).loginWithToken();
    });

    describe("Token Action When User ban", () => {

        step("Get Goods Success By Token", async () => {
            const { status } = await request.get("/api/v1/users/goods").then();
            status.should.be.eql(200);
        });

        step("Ban User", () => {
            return usersSvr.modify(ids.users[0], { active: false });
        });

        step("Get Goods Fail By Token", async () => {
            const { status } = await request.get("/api/v1/users/goods").then();
            status.should.be.eql(403);
        });

        step("Allow User", () => {
            return usersSvr.modify(ids.users[0], { active: true });
        });

        step("Get Goods Fail By Token", async () => {
            const { status } = await request.get("/api/v1/users/goods").then();
            status.should.be.eql(200);
        });

    });

});
