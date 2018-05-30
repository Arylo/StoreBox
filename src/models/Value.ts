import { model, Model as M, SchemaDefinition } from "mongoose";
import { Base, IDoc, IDocRaw } from "./common";

const Definition: SchemaDefinition = {
    key: { type: String, required: true },
    value: { type: String, required: true }
};

export interface IValues extends IDocRaw {
    key: string;
    value: string;
}

const ValuesSchema = new Base(Definition).createSchema();

export const Flag = "values";

export type ValueDoc = IDoc<IValues>;

export const Model: M<ValueDoc> = model(Flag, ValuesSchema);
