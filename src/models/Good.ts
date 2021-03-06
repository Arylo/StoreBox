import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import {
    Base, IDoc, IDocRaw, ObjectId, MODIFY_MOTHODS, existsValidator
} from "@models/common";
import { IValues, Flag as ValueFlag } from "@models/Value";
import { IUser, FLAG as UserFlag } from "@models/User";
import { ICategory, FLAG as CategoryFlag } from "@models/Categroy";
import newCache  = require("@utils/newCache");

export const FLAG = "goods";

export const cache = newCache(FLAG);

export type GoodDoc = IDoc<IGoods>;

const Definition: SchemaDefinition = {
    limitAt: Date,
    hidden: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    md5sum: { type: String, required: true},
    sha256sum: { type: String, required: true},
    filename: { type: String, required: true },
    originname: { type: String, required: true },
    category: {
        type: SchemaTypes.ObjectId,
        ref: CategoryFlag,
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
    category: ObjectId | ICategory;
    version: string;
    uploader: ObjectId | IUser;
    tags?: string[];
    attributes?: [ ObjectId ] | [ IValues ];
}

export interface IGoodsRaw extends IGoods {
    category: ICategory;
    uploader: IUser;
    attributes?: [ IValues ];
}

const GoodsSchema = new Base(Definition).createSchema();

// region validators
GoodsSchema.path("md5sum").validate({
    isAsync: true,
    validator: async function md5ExistsValidator(val, respond) {
        respond(await existsValidator.bind(this)(Model, "md5sum", val, {
            update: false
        }));
    },
    message: "The file is existed"
});

GoodsSchema.path("sha256sum").validate({
    isAsync: true,
    validator: async function sha256ExistsValidator(val, respond) {
        respond(await existsValidator.bind(this)(Model, "sha256sum", val, {
            update: false
        }));
    },
    message: "The file is existed"
});
// endregion validators

for (const method of MODIFY_MOTHODS) {
    GoodsSchema.post(method, () => {
        cache.clear();
    });
}

export const Model = model(FLAG, GoodsSchema) as M<GoodDoc>;
