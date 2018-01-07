import { ConfigObj } from "./config.d";

import configModule = require("y-config");
import * as ph from "path";
import * as fs from "fs";

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

for (const item of Object.keys(configModule.paths)) {
    const curPath = configModule.paths[item];
    if (!ph.isAbsolute(configModule.paths[item])) {
        configModule.paths[item] = ph.resolve(`${__dirname}/../../${curPath}`);
    }
}

export const config = configModule.getConfig() as ConfigObj;

import { systemLogger } from "../modules/common/helper/log";
systemLogger.debug(config);
