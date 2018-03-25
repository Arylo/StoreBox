import { model, SchemaDefinition, Model as M } from "mongoose";
import { Base, IDoc, IDocRaw, MODIFY_MOTHODS } from "./common";
import { config } from "@utils/config";
import keyv =  require("keyv");

import { isTest } from "../modules/common/helper/env";

export const cache = new keyv({
    uri: isTest ? undefined : config.redis.url,
    namespace: "Categories"
});

const Definition: SchemaDefinition = {
    key: { type: String, required: true },
    value: { type: String, required: true }
};

export interface ISystem extends IDocRaw {
    key: string;
    value: string;
}

const SystemSchema = new Base(Definition).createSchema();

export const Flag = "sys";

export type SystemDoc = IDoc<ISystem>;

for (const method of MODIFY_MOTHODS) {
    SystemSchema.post(method, () => {
        cache.clear();
    });
}

export const Model: M<SystemDoc> = model(Flag, SystemSchema);
