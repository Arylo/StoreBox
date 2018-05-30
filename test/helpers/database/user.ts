import { ObjectId } from "@models/common";
import { Model as UsersModel } from "@models/User";
import { SystemService } from "@services/system";
import { UsersService } from "@services/users";
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
    return init().addUser({
        username, password
    }, gid);
};
