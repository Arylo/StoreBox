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
import { Model as LogsModel } from "@models/Log";

import { connectDatabase } from "../../src/modules/database/database.providers";
import { newUser as newUserFn } from "./database/user";
import * as regexps from "./database/regexps";
import * as categories from "./database/categories";
import { newName, sleep } from "./utils";
import { remove } from "./files";

config.db.database = "storebox-test";

export interface IIds {
    values?: ObjectId[];
    goods?: ObjectId[];
    regexps?: ObjectId[];
    users?: ObjectId[];
    tokens?: ObjectId[];
    categories?: ObjectId[];
    collections?: ObjectId[];
    usergroups?: ObjectId[];
    userusergroups?: ObjectId[];
    logs?: ObjectId[];
}

/**
 * 连接数据库
 */
export const connect = connectDatabase;

export const drop = async (ids?: IIds) => {
    await sleep(250);
    const MODEL_IDMETHOD_MAP = {
        "values": ValuesModel,
        "goods": GoodsModels,
        "regexps": RegexpsModel,
        "users": UsersModel,
        "tokens": TokensModel,
        "categories": CategoriesModel,
        "collections": CollectionsModel,
        "usergroups": UsergroupsModel,
        "userusergroups": UserUsergroupsModel,
        "logs": LogsModel
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
        if (method === "categories") {
            await remove((ids[method] || [ ]).reduce((arr, id) => {
                arr.push(`${config.paths.upload}/${id.toString()}`);
                return arr;
            }, [ ]));
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
