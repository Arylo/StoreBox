import { ObjectId } from "@models/common";
import { config } from "@utils/config";

// region import Models
import { CategoryDoc, Model as CategoriesModel } from "@models/Categroy";
import { Model as CollectionsModel } from "@models/Collection";
import { Model as GoodsModels } from "@models/Good";
import { Model as LogsModel } from "@models/Log";
import { Model as RegexpsModel } from "@models/Regexp";
import { Model as TagsModel } from "@models/Tag";
import { Model as TokensModel } from "@models/Token";
import { Model as UsersModel } from "@models/User";
import { Model as UserUsergroupsModel } from "@models/User-Usergroup";
import { Model as UsergroupsModel } from "@models/Usergroup";
import { Model as ValuesModel } from "@models/Value";
// endregion import Models

import { connectDatabase } from "../../src/modules/database/database.providers";
import * as categories from "./database/categories";
import * as regexps from "./database/regexps";
import { newUser as newUserFn } from "./database/user";
import { remove } from "./files";
import { newName, sleep } from "./utils";

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
    tags?: ObjectId[];
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
        "logs": LogsModel,
        "tags": TagsModel
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
