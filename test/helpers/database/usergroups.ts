import { ObjectId } from "@models/common";
import { Model as UserUsergroupsModel } from "@models/User-Usergroup";
import { Model as UsergroupsModel } from "@models/Usergroup";
import faker = require("faker");

/// <reference path="./usergroups.d.ts" />

export const getLinkIdsByUserId = async (uid: ObjectId) => {
    return (await UserUsergroupsModel.find({ user: uid }).exec())
        .map((item) => {
            return item._id as ObjectId;
        });
};

export const getLinkIdsByUsergroupId = async (gid: ObjectId) => {
    return (await UserUsergroupsModel.find({ usergroup: gid }).exec())
        .map((item) => {
            return item._id as ObjectId;
        });
};

export const newUsergroup = async (
    name = `${faker.random.word}${Math.random()}`, uid?: ObjectId
) => {
    const group = await UsergroupsModel.create({ name });
    if (uid) {
        const link = await UserUsergroupsModel.create({
            user: uid, usergroup: group._id
        });
    }
    return group;
};
