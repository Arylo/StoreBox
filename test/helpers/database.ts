import faker = require("faker");
import { config } from "@utils/config";
import { ObjectId } from "@models/common";
import { connectDatabase } from "../../src/modules/database/database.providers";

import { Model as ValuesModel } from "@models/Value";
import { Model as GoodsModels } from "@models/Good";
import { Model as RegexpsModel } from "@models/Regexp";
import { Model as UsersModel } from "@models/User";
import { Model as TokensModel } from "@models/Token";
import { Model as CategoriesModel, CategoryDoc } from "@models/Categroy";

config.db.database = "storebox-test";

interface IIds {
    values?: ObjectId[];
    goods?: ObjectId[];
    regexps?: ObjectId[];
    users?: ObjectId[];
    categories?: ObjectId[];
    tokens?: ObjectId[];
}

/**
 * 连接数据库
 */
export const connect = connectDatabase;

export const drop = async (ids?: IIds) => {
    if (!ids) {
        await ValuesModel.remove({ }).exec();
        await GoodsModels.remove({ }).exec();
        await RegexpsModel.remove({ }).exec();
        await UsersModel.remove({ }).exec();
        await CategoriesModel.remove({ }).exec();
        return;
    }
    for (const id of (ids.values || [ ])) {
        await ValuesModel.findByIdAndRemove(id).exec();
    }
    for (const id of (ids.goods || [ ])) {
        await GoodsModels.findByIdAndRemove(id).exec();
    }
    for (const id of (ids.regexps || [ ])) {
        await RegexpsModel.findByIdAndRemove(id).exec();
    }
    for (const id of (ids.users || [ ])) {
        await UsersModel.findByIdAndRemove(id).exec();
    }
    for (const id of (ids.tokens || [ ])) {
        await TokensModel.findByIdAndRemove(id).exec();
    }
    for (const id of (ids.categories || [ ])) {
        await CategoriesModel.findByIdAndRemove(id).exec();
    }
};

export const addCategoryAndRegexp = async (regexp: RegExp) => {
    const category = await CategoriesModel.create({
        name: faker.name.findName()
    });
    const reg = await newRegexp(faker.random.word(), regexp);
    await RegexpsModel.link(reg._id, category._id);
    return [category, reg];
};

export const newUser = (username: string, password: string) => {
    return UsersModel.addUser(username, password);
};

export const newRegexp = (name: string, value: RegExp) => {
    return RegexpsModel.addRegexp(name, value.source);
};

export const newCategory = (obj: object) => {
    return CategoriesModel.create(obj) as Promise<CategoryDoc>;
};
