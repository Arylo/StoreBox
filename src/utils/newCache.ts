import keyv =  require("keyv");
import { isTest } from "@utils/env";
import { config } from "@utils/config";

export = (namespace: string) => {
    return new keyv({
        uri: isTest ? undefined : config.redis.url,
        namespace
    });
};
