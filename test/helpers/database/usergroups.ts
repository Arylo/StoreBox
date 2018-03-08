import faker = require("faker");
import { ObjectId } from "@models/common";
import { Model as UserUsergroupsModel } from "@models/User-Usergroup";
import { UsergroupsService } from "@services/usergroups";
import { newName } from "../utils";

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
    name = newName(), uid?: ObjectId
) => {
    const svr = new UsergroupsService();
    const group = await svr.add({ name });
    if (uid) {
        await svr.addUserToGroup(group._id, uid);
    }
    return group;
};
