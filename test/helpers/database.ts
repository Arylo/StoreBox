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
    const reg = await RegexpsModel.addRegexp(
        faker.random.word(), regexp.source
    );
    await RegexpsModel.link(reg._id, categroy._id);
    return [categroy, reg];
};

export const newUser = async (username: string, password: string) => {
    return await UsersModel.addUser(username, password);
};
