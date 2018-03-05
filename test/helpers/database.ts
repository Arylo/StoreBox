import faker = require("faker");
import { config } from "@utils/config";
import { ObjectId } from "@models/common";

import { Model as ValuesModel } from "@models/Value";
import { Model as GoodsModels } from "@models/Good";
import { Model as RegexpsModel } from "@models/Regexp";
import { Model as UsersModel } from "@models/User";
import { Model as TokensModel } from "@models/Token";
import { Model as CollectionsModel } from "@models/Collection";
import { Model as CategoriesModel, CategoryDoc } from "@models/Categroy";
import { Model as UsergroupsModel } from "@models/Usergroup";
import { Model as UserUsergroupsModel } from "@models/User-Usergroup";

import { connectDatabase } from "../../src/modules/database/database.providers";
import { newUser as newUserFn } from "./database/user";

config.db.database = "storebox-test";

interface IIds {
    values?: ObjectId[];
    goods?: ObjectId[];
    regexps?: ObjectId[];
    users?: ObjectId[];
    categories?: ObjectId[];
    tokens?: ObjectId[];
    collections?: ObjectId[];
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
    const MODEL_IDMETHOD_MAP = {
        "values": ValuesModel,
        "goods": GoodsModels,
        "regexps": RegexpsModel,
        "users": UsersModel,
        "tokens": TokensModel,
        "categories": CategoriesModel,
        "collections": CollectionsModel,
        "usergroups": UsergroupsModel,
        "userusergroups": UserUsergroupsModel
    };
    for (const method of Object.keys(MODEL_IDMETHOD_MAP)) {
        const model = MODEL_IDMETHOD_MAP[method];
        for (const id of (ids[method] || [ ])) {
            await model.findByIdAndRemove(id).exec();
            if (method === "users") {
                await UserUsergroupsModel.remove({ user: id }).exec();
            } else if (method === "usergroups") {
                await UserUsergroupsModel.remove({ usergroup: id }).exec();
            }
        }
    }
};

export const addCategoryAndRegexp = async (regexp: RegExp) => {
    const category = await CategoriesModel.create({
        name: faker.name.findName()
    });
    const reg = await newRegexp(faker.random.word(), regexp, category._id);
    return [category, reg];
};

export const newUser = newUserFn;

export const newRegexp = (name: string, value: RegExp, link?) => {
    return RegexpsModel.addRegexp(name, value.source, link);
};

export const newCategory = (obj: object) => {
    return CategoriesModel.create(obj) as Promise<CategoryDoc>;
};
