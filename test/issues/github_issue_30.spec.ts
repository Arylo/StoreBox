import isRegExp = require("@utils/isRegExp");
import { connect } from "../helpers/database";
import { Model as RegexpsModel } from "@models/Regexp";
import * as faker from "faker";

/**
 * Fix [Issue 30](https://github.com/Arylo/StoreBox/issues/30)
 */
describe("Fix Issues", () => {

    before(() => {
        return connect();
    });

    describe("Github 30 [RegExp Check]", () => {

        it("Error RegExp String", () => {
            const result = isRegExp("+");
            should(result).be.false();
        });

        it("Right RegExp String", () => {
            const result = isRegExp(".+");
            should(result).be.true();
        });

        it("Generate wrong Regexp item", async () => {
            try {
                await RegexpsModel.create({
                    name: faker.random.word(),
                    value: "*"
                });
            } catch (error) {
                should(error).have.not.empty();
            }
        });

    });

});
