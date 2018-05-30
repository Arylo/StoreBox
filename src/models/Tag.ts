import { model, Model as M, SchemaDefinition } from "mongoose";
import { Base, IDoc, IDocRaw } from "./common";

const Definition: SchemaDefinition = {
    name: { type: String, required: true },
    tags: [{ type: String, required: true }],
    hidden: { type: Boolean, default: false }
};

export interface ITagRaw {
    name: string;
    tags: string[];
    hidden?: boolean;
}

export type ITag = IDocRaw & ITagRaw;

const TagsSchema = new Base(Definition).createSchema();

export const Flag = "taggroups";

export type TagDoc = IDoc<ITag>;

export const Model: M<TagDoc> = model(Flag, TagsSchema);
