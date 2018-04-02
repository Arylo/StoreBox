import { Model as CategoriesModel } from "@models/Categroy";
import { Model as ValuesModel } from "@models/Value";
import db = require("../helpers/database");
import { addCategories } from "../helpers/database/categories";
import { newName, newIds } from "../helpers/utils";

describe("Category Model", () => {

    before(() => {
        return db.connect();
    });

    const ids = newIds();

    after(() => {
        return db.drop(ids);
    });

    it("Add Category", async () => {
        const ctx = {
            name: newName()
        };
        const obj = await CategoriesModel.create(ctx);
        ids.categories.push(obj._id);
        obj.toObject().should.have.properties({
            name: ctx.name,
            tags: [ ],
            attributes: [ ]
        });
    });

    // describe("Loop Parent ID Checker", () => {

    //     let cids = [ ];
    //     before(async () => {
    //         cids = await addCategories();
    //         ids.categories.push(...cids);
    //     });

    //     it("# 0", async () => {
    //         let err;
    //         try {
    //             await CategoriesModel.moveCategory(cids[2], cids[6]);
    //         } catch (error) {
    //             err = error;
    //         }
    //         err.should.not.be.an.empty();
    //     });
    // });

});
