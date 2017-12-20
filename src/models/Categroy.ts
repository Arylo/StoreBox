import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import { Base, IDoc, IDocRaw, ObjectId } from "@models/common";
import { IValues, Flag as ValueFlag } from "@models/Value";

export const Flag = "categroies";

const Definition: SchemaDefinition = {
    name: { type: String, required: true, unique: true },
    tags: [ String ],
    attributes: [{
        type: SchemaTypes.ObjectId,
        ref: ValueFlag
    }],
    pid: {
        type: SchemaTypes.ObjectId,
        ref: Flag
    }
};

export interface ICategroy extends IDocRaw {
    name: string;
    tags: string[];
    attributes: [ ObjectId ] | [ IValues ];
    pid: ObjectId | ICategroy;
}

export interface ICategroyRaw extends ICategroy {
    attributes: [ IValues ];
    pid: ICategroy;
}

const CategroySchema = new Base(Definition).createSchema();

export type CategroyDoc = IDoc<ICategroy>;

export const Model: M<CategroyDoc> = model(Flag, CategroySchema);
