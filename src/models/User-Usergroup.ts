import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import { FLAG as UF, IUser } from "@models/User";
import { FLAG as GF, IUsergroups } from "@models/Usergroup";
import { ObjectId } from "@models/common";
import { Base, IDoc, IDocRaw } from "./common";

const Definition: SchemaDefinition = {
    user: {
        type: SchemaTypes.ObjectId,
        ref: UF,
        index: true,
        required: true
    },
    usergroup: {
        type: SchemaTypes.ObjectId,
        ref: GF,
        index: true,
        required: true
    }
};

/**
 * User-Usergroup Model FLAG
 */
export const FLAG = "user-usergroups";

/**
 * User-Usergroup Doc Interface
 */
export interface IUserUsergroups extends IDocRaw {
    user: ObjectId | IUser;
    usergroup: ObjectId | IUsergroups;
}

/**
 * User-Usergroup Raw Doc Interface
 */
export interface IUserUsergroupsRaw extends IUserUsergroups {
    user: IUser;
    usergroup: IUsergroups;
}

export type UserUsergroupDoc = IDoc<IUserUsergroups>;

const UserUsergroupsSchema = new Base(Definition).createSchema();

// region validators

UserUsergroupsSchema.path("user").validate({
    isAsync: true,
    validator: async function userIdModifyValidator(val, respond) {
        if (!this.isNew) {
            const id = this.getQuery()._id;
            const cur = await Model.findById(id).exec();
            if (cur.toObject().user === val) {
                return respond(true);
            }
        }
        const result = await Model.findOne({ user: val }).exec();
        return respond(!result);
    },
    message: "The User ID is existed"
});

// endregion validators

/**
 * User-Usergroup Model
 */
export const Model: M<UserUsergroupDoc> = model(FLAG, UserUsergroupsSchema);
