import { IConfigObj } from "./config.d";

import * as fs from "fs";
import * as ph from "path";
import configModule = require("y-config");

const CONFIG_PATH = `${__dirname}/../../config`;

configModule.setConfigPath(`${CONFIG_PATH}/app.default.yaml`);

const CONFIG_FILEPATHS = [
    `${CONFIG_PATH}/app.json`,
    `${CONFIG_PATH}/app.yaml`
];
for (const filepath of CONFIG_FILEPATHS) {
    if (fs.existsSync(filepath) && configModule.setCustomConfigPath(filepath)) {
        break;
    }
}

// region Paths Process
for (const item of Object.keys(configModule.paths)) {
    const curPath = configModule.paths[item];
    if (!ph.isAbsolute(configModule.paths[item])) {
        configModule.paths[item] = ph.resolve(`${__dirname}/../../${curPath}`);
    }
}
// endregion Paths Process

// region Redis Process
configModule.redis.url = configModule.redis.url ||
`redis://${configModule.redis.host}:${configModule.redis.port}`;
if (
    configModule.redis.url.indexOf("redis://") !== 0 &&
    configModule.redis.url.indexOf("//") !== 0
) {
    configModule.redis.url = `redis://${configModule.redis.url}`;
}
// endregion Redis Process

// region Default Values Check
try {
    const values = [
        configModule.defaults.user.name,
        configModule.defaults.user.pass,
        configModule.defaults.group.name
    ];
    for (const item of values) {
        if (item.length < 4) {
            throw new TypeError("Default Value Must great than 4 words.");
        }
    }
} catch (error) {
    throw new TypeError(error.toString());
}
// endregion Default Values Check

export const config = configModule.getConfig() as IConfigObj;

import { systemLogger } from "./log";
systemLogger.debug(config);
