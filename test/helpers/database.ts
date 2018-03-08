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
import * as regexps from "./database/regexps";
import * as categories from "./database/categories";
import { newName } from "./utils";

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

export const addCategoryAndRegexp = async (regexp: RegExp, pid?: ObjectId) => {
    const category = await newCategory({
        name: newName(),
        pid: pid
    });
    const reg = await newRegexp(newName(), regexp, category._id);
    return [ category, reg ];
};

export const newUser = newUserFn;

export const newRegexp = (name: string, value: RegExp, link?: ObjectId) => {
    return regexps.newRegexp({
        name, value: value.source, link, hidden: false
    });
};

export const newCategory = categories.newCategory;
