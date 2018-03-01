import { Model as UsersModel } from "@models/User";
import { ObjectId } from "@models/common";
import faker = require("faker");

export const newUser = (
    username = `${faker.name.firstName()}${Math.random()}`,
    password = `${faker.random.words()}${Math.random()}`
) => {
    return UsersModel.addUser(username, password);
};
