import { model, SchemaDefinition, Model as M } from "mongoose";
import { Base, IDoc, IDocRaw } from "./common";

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

export const Model: M<SystemDoc> = model(Flag, SystemSchema);
