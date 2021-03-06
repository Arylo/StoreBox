import { model, SchemaDefinition, Model as M } from "mongoose";
import { Base, IDoc, IDocRaw } from "./common";
import newCache  = require("@utils/newCache");

const Definition: SchemaDefinition = {
    key: { type: String, required: true },
    type: { type: String, required: true },
    ua: { type: String, required: true },
    ipaddr: { type: String, required: true }
};

export interface ILogs extends IDocRaw {
    key: string;
    type: string;
    ua: string;
    ipaddr: string;
}

export const FLAG = "logs";

export const cache = newCache(FLAG);

const Schema = new Base(Definition).createSchema();

export type LogDoc = IDoc<ILogs>;

export const Model: M<LogDoc> = model(FLAG, Schema);
