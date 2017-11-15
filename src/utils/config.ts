import { ConfigObj } from "./config.d";

import configModule = require("y-config");
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

export const config = configModule.getConfig() as ConfigObj;
