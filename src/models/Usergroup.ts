import { existsValidator, ObjectId } from "@models/common";
import { FLAG as UF, IUser } from "@models/User";
import newCache  = require("@utils/newCache");
import { model, Model as M, SchemaDefinition, SchemaTypes } from "mongoose";
import { Base, IDoc, IDocRaw } from "./common";

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
