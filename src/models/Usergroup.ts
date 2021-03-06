import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import { FLAG as UF, IUser } from "@models/User";
import { ObjectId, existsValidator } from "@models/common";
import { Base, IDoc, IDocRaw } from "./common";
import newCache  = require("@utils/newCache");

const Definition: SchemaDefinition = {
    name: { type: String, required: true }
};

export const FLAG = "usergroups";

export const cache = newCache(FLAG);

export interface IUsergroups extends IDocRaw {
    name: string;
}

export type UsergroupDoc = IDoc<IUsergroups>;

const UsergroupsSchema = new Base(Definition).createSchema();

UsergroupsSchema.path("name").validate({
    isAsync: true,
    validator: async function nameExistValidator(val, respond) {
        return respond(await existsValidator.bind(this)(Model, "name", val));
    },
    message: "The Name is exist"
});

export const Model: M<UsergroupDoc> = model(FLAG, UsergroupsSchema);
