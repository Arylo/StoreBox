import { model, SchemaDefinition, Model as M } from "mongoose";
import { Base, IDoc, IDocRaw, MODIFY_MOTHODS } from "./common";
import newCache  = require("@utils/newCache");

export const FLAG = "system";

export const cache = newCache(FLAG);

const Definition: SchemaDefinition = {
    key: { type: String, required: true },
    value: { type: String, required: true }
};

export interface ISystem extends IDocRaw {
    key: string;
    value: string;
}

const SystemSchema = new Base(Definition).createSchema();

export type SystemDoc = IDoc<ISystem>;

for (const method of MODIFY_MOTHODS) {
    SystemSchema.post(method, () => {
        cache.clear();
    });
}

export const Model: M<SystemDoc> = model(FLAG, SystemSchema);
