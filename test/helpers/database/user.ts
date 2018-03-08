import { Model as UsersModel } from "@models/User";
import { ObjectId } from "@models/common";
import { UsersService } from "@services/users";
import { SystemService } from "@services/system";
import { newName } from "../utils";

export const newUser = (username?: string, password?: string) => {
    return newUserWithUsergroup(username, password);
};

export const newUserWithUsergroup = (
    username = newName(), password = newName(), gid?: ObjectId
) => {
    return new UsersService(new SystemService()).addUser({
        username, password
    }, gid);
};
