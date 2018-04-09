import faker = require("faker");
import { IIds } from "./database";

export const sleep = (ms: number) => {
    return new Promise((reslove) => {
        setTimeout(reslove, ms);
    });
};

export const newName = (prefix = "") => {
    const randomStr = `${Math.random()}`.replace(/(^0|\D)/g, "");
    const name = `${faker.random.word()}${randomStr}${Date.now()}`;
    return `${prefix}${name}`;
};

export const newIds = (): IIds => {
    return {
        values: [ ],
        goods: [ ],
        regexps: [ ],
        users: [ ],
        tokens: [ ],
        categories: [ ],
        collections: [ ],
        usergroups: [ ],
        userusergroups: [ ],
        logs: [ ],
        tags: [ ]
    };
};
