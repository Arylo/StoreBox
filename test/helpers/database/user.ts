import { Model as UsersModel } from "@models/User";
import { ObjectId } from "@models/common";
import { UsersService } from "@services/users";
import { SystemService } from "@services/system";
import faker = require("faker");

export const newUser = (
    username = `${faker.name.firstName()}${Math.random()}`,
    password = `${faker.random.words()}${Math.random()}`
) => {
    return UsersModel.addUser(username, password);
};

export const newUserWithUsergroup = (
    username = `${faker.name.firstName()}${Math.random()}`,
    password = `${faker.random.words()}${Math.random()}`,
    gid?: ObjectId
) => {
    return new UsersService(new SystemService()).addUser({
        username, password
    }, gid);
};
