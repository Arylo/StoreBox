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

/**
 * User-Usergroup Model
 */
export const Model: M<UserUsergroupDoc> = model(FLAG, UserUsergroupsSchema);
