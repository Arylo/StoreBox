import faker = require("faker");
import { Model as RegexpsModel } from "@models/Regexp";
import { Model as CategroyModel } from "@models/Categroy";

export const addCategroyAndRegexp = async (regexp: RegExp) => {
    const categroy = await CategroyModel.create({
        name: faker.name.findName()
    });
    const reg = await RegexpsModel.addRegexp(
        faker.random.word(), regexp.source
    );
    await RegexpsModel.link(reg._id, categroy._id);
    return [categroy, reg];
};
