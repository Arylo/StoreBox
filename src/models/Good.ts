import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import { Base, IDoc, IDocRaw, ObjectId } from "@models/common";
import { IValues, Flag as ValueFlag } from "@models/Value";
import { IUser, Flag as UserFlag } from "@models/User";
import { ICategroy, Flag as CategroyFlag } from "@models/Categroy";

export const Flag = "goods";

const Definition: SchemaDefinition = {
    limitAt: Date,
    hidden: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    md5sum: { type: String, required: true},
    sha256sum: { type: String, required: true},
    filename: { type: String, required: true },
    originname: { type: String, required: true },
    categroy: {
        type: SchemaTypes.ObjectId,
        ref: CategroyFlag,
        required: true
    },
    uploader: {
        type: SchemaTypes.ObjectId,
        ref: UserFlag,
        required: true
    },
    tags: [ String ],
    attributes: [{
        type: SchemaTypes.ObjectId,
        ref: ValueFlag
    }]
};

export interface IGoods extends IDocRaw {
    limitAt?: Date;
    hidden: boolean;
    active: boolean;
    md5sum?: string;
    sha256sum?: string;
    filename?: string;
    readonly originname: string;
    categroy: ObjectId | ICategroy;
    version: string;
    readonly uploader: ObjectId | IUser;
    tags?: string[];
    attributes?: [ ObjectId ] | [ IValues ];
}

export interface IGoodsRaw extends IGoods {
    categroy: ICategroy;
    uploader: IUser;
    attributes?: [ IValues ];
}

const GoodsSchema = new Base(Definition).createSchema();

export type GoodDoc = IDoc<IGoods>;

export const Model: M<GoodDoc> = model(Flag, GoodsSchema);
