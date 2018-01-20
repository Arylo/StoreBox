import faker = require("faker");
import { config } from "@utils/config";
import { ObjectId } from "@models/common";
import { connectDatabase } from "../../src/modules/database/database.providers";

import { Model as ValuesModel } from "@models/Value";
import { Model as GoodsModels } from "@models/Good";
import { Model as RegexpsModel } from "@models/Regexp";
import { Model as UsersModel } from "@models/User";
import { Model as CategroiesModel } from "@models/Categroy";

config.db.database = "storebox-test";

interface IIds {
    values?: ObjectId[];
    goods?: ObjectId[];
    regexps?: ObjectId[];
    users?: ObjectId[];
    categroies?: ObjectId[];
}

export const connect = connectDatabase;

export const drop = async (ids?: IIds) => {
    if (!ids) {
        await ValuesModel.remove({ }).exec();
        await GoodsModels.remove({ }).exec();
        await RegexpsModel.remove({ }).exec();
        await UsersModel.remove({ }).exec();
        await CategroiesModel.remove({ }).exec();
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
    for (const id of (ids.categroies || [ ])) {
        await CategroiesModel.findByIdAndRemove(id).exec();
    }
};

export const addCategroyAndRegexp = async (regexp: RegExp) => {
    const categroy = await CategroiesModel.create({
        name: faker.name.findName()
    });
    const reg = await newRegexp(faker.random.word(), regexp);
    await RegexpsModel.link(reg._id, categroy._id);
    return [categroy, reg];
};

export const newUser = (username: string, password: string) => {
    return UsersModel.addUser(username, password);
};

export const newRegexp = (name: string, value: RegExp) => {
    return RegexpsModel.addRegexp(name, value.source);
};
