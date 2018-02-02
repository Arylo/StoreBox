import { Model as CategoriesModel } from "@models/Categroy";
import { Model as ValuesModel } from "@models/Value";
import db = require("../helpers/database");
import faker = require("faker");

describe("Category Model", () => {

    before(() => {
        return db.connect();
    });

    const ids = {
        categories: [ ]
    };
    after(() => {
        return db.drop(ids);
    });

    it("Add Category", async () => {
        const ctx = {
            name: faker.name.firstName()
        };
        const obj = await CategoriesModel.create(ctx);
        ids.categories.push(obj._id);
        obj.toObject().should.have.properties({
            name: ctx.name,
            tags: [ ],
            attributes: [ ]
        });
    });

    describe("Loop Parent ID Checker", () => {

        let cids = [ ];
        before(async () => {
            cids = [];
            for (let i = 0; i < 10; i++) {
                const result = await CategoriesModel.create({
                    name: faker.name.firstName()
                });
                cids.push(result._id);
                ids.categories.push(result._id);
            }
            // [parent, child]
            const initGroups = [
                [0, 1], [0, 2], [0, 3],
                [1, 4], [2, 5],
                [5, 6], [6, 7],
                [8, 9]
            ];
            for (const set of initGroups) {
                await CategoriesModel.moveCategory(cids[set[1]], cids[set[0]]);
            }
        });

        it("# 0", async () => {
            let err;
            try {
                await CategoriesModel.moveCategory(cids[2], cids[6]);
            } catch (error) {
                err = error;
            }
            err.should.not.be.an.empty();
        });
    });

});
