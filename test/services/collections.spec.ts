import { CollectionsService } from "@services/collections";
import { Model as UsersModel } from "@models/User";
import db = require("../helpers/database");
import faker = require("faker");

describe("Collections Service Test Unit", () => {

    let collectionsSvr: CollectionsService;

    before(() => {
        return db.connect();
    });

    beforeEach(() => {
        collectionsSvr = new CollectionsService();
    });

    it("Fail to Create a Collection with Empty Good # 0", async () => {
        const user = await UsersModel.findOne().exec();
        try {
            await collectionsSvr.create({
                name: faker.random.word(),
                creator: user._id
            });
        } catch (error) {
            should(error).have.not.empty();
        }
    });

    it("Fail to Create a Collection with Empty Good # 1", async () => {
        const user = await UsersModel.findOne().exec();
        try {
            await collectionsSvr.create({
                name: faker.random.word(),
                goods: [ ],
                creator: user._id
            });
        } catch (error) {
            should(error).have.not.empty();
        }
    });

    it("Fail to Create a Collection with Nonexist Good", async () => {
        const user = await UsersModel.findOne().exec();
        try {
            await collectionsSvr.create({
                name: faker.random.word(),
                goods: [ "5a77c24ec1ae19d4a808e134" ],
                creator: user._id
            });
        } catch (error) {
            should(error).have.not.empty();
        }
    });

    it("The Function `count` will return number", async () => {
        const user = await UsersModel.findOne().exec();
        const count = await collectionsSvr.count(user._id);
        should(count).be.a.Number();
    });

    it("The Function `countPage` will return number", async () => {
        const user = await UsersModel.findOne().exec();
        const count = await collectionsSvr.countPage(user._id);
        should(count).be.a.Number();
    });

    it("The Function `list` will return array", async () => {
        const user = await UsersModel.findOne().exec();
        const arr = await collectionsSvr.list(user._id);
        should(arr).be.an.Array();
    });

});
