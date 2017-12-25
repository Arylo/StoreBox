import { Model as CategroiesModel } from "@models/Categroy";
import { Model as ValuesModel } from "@models/Value";
import db = require("../helpers/database");
import faker = require("faker");

describe("Category Model", () => {

    before(() => {
        return db.connect();
    });

    afterEach(async () => {
        await CategroiesModel.remove({ }).exec();
        await ValuesModel.remove({ }).exec();
    });

    it("Add Category", async () => {
        const ctx = {
            name: faker.name.firstName()
        };
        const obj = await CategroiesModel.create(ctx);
        obj.toObject().should.have.properties({
            name: ctx.name,
            tags: [ ],
            attributes: [ ]
        });
    });

    describe("Loop Parent ID Checker", () => {

        let ids = [ ];
        before(async () => {
            ids = [];
            for (let i = 0; i < 10; i++) {
                const result = await CategroiesModel.create({
                    name: faker.name.firstName()
                });
                ids.push(result._id);
            }
            // [parent, child]
            const initGroups = [
                [0, 1], [0, 2], [0, 3],
                [1, 4], [2, 5],
                [5, 6], [6, 7],
                [8, 9]
            ];
            for (const set of initGroups) {
                await CategroiesModel.moveCategroy(ids[set[1]], ids[set[0]]);
            }
        });

        it("# 0", async () => {
            let err;
            try {
                await CategroiesModel.moveCategroy(ids[2], ids[6]);
            } catch (error) {
                err = error;
            }
            err.should.not.be.an.empty();
        });
    });

});
