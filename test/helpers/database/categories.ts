import { ObjectId } from "@models/common";
import { Model as CategoriesModel, CategoryDoc } from "@models/Categroy";
import faker = require("faker");

export const newCategory = (obj: object) => {
    return CategoriesModel.create(obj) as Promise<CategoryDoc>;
};

/**
 * Add 11 Categories
 * ```
 *          - 1 - 4
 *          |
 *      - 0 - 2 - 5 - 6 - 8
 *      |   |       |
 * pid -|   - 3     - 7
 *      |
 *      - 9 - 10
 * ```
 * @param pid Parent Category ID
 * @returns Categories' ID
 */
export const addCategories = async (pid?: ObjectId) => {
    const cids: ObjectId[ ] = [];
    // Create 11 Categories
    for (let i = 0; i < 11; i++) {
        const result = await CategoriesModel.create({
            name: faker.name.firstName() + i
        });
        cids.push(result._id);
    }
    // [parent, child]
    const initGroups = [
        [0, 1], [0, 2], [0, 3],
        [1, 4], [2, 5],
        [5, 6], [5, 7], [6, 8],
        [9, 10]
    ];
    for (const set of initGroups) {
        await CategoriesModel.moveCategory(cids[set[1]], cids[set[0]]);
    }
    if (pid) {
        await CategoriesModel.moveCategory(cids[9], pid);
        await CategoriesModel.moveCategory(cids[0], pid);
    }
    return cids;
};

export const getNameById = async (id: ObjectId) => {
    const doc = await CategoriesModel.findById(id).exec();
    return doc.toObject().name || undefined;
};
