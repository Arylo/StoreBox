import faker = require("faker");

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
