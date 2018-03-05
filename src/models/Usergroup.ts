import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import { FLAG as UF, IUser } from "@models/User";
import { ObjectId } from "@models/common";
import { Base, IDoc, IDocRaw } from "./common";

const Definition: SchemaDefinition = {
    name: { type: String, required: true }
};

export const FLAG = "usergroups";

export interface IUsergroups extends IDocRaw {
    name: string;
}

export type UsergroupDoc = IDoc<IUsergroups>;

const UsergroupsSchema = new Base(Definition).createSchema();

UsergroupsSchema.path("name").validate({
    isAsync: true,
    validator: async function nameExistValidator(val, respond) {
        if (!this.isNew) {
            const id = this.getQuery()._id;
            const ug = await Model.findById(id).exec();
            if (ug.toObject().user === val) {
                return respond(true);
            }
        }
        const ug = await Model.findOne({ name: val }).exec();
        return respond(!ug);
    },
    message: "The Name is exist"
});

export const Model: M<UsergroupDoc> = model(FLAG, UsergroupsSchema);
