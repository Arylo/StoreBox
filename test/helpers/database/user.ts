import { Model as UsersModel } from "@models/User";
import { ObjectId } from "@models/common";
import { UsersService } from "@services/users";
import { SystemService } from "@services/system";
import { newName } from "../utils";

let usersSvr: UsersService;

const init = () => {
    if (!usersSvr) {
        usersSvr = new UsersService(new SystemService());
    }
    return usersSvr;
};

export const newUser = (username?: string, password?: string) => {
    return newUserWithUsergroup(username, password);
};

export const newUserWithUsergroup = (
    username = newName(), password = newName(), gid?: ObjectId
) => {
    init();
    return usersSvr.addUser({
        username, password
    }, gid);
};
