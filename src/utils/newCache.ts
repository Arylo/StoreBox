import { config } from "@utils/config";
import { isTest } from "@utils/env";
import keyv =  require("keyv");

export = (namespace: string) => {
    return new keyv({
        uri: isTest ? undefined : config.redis.url,
        namespace
    });
};
