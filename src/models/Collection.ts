import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import {
    Base, IDoc, IDocRaw, ObjectId, MODIFY_MOTHODS, existsValidator
} from "@models/common";
import { IGoods, FLAG as GoodFlag, Model as GoodsModels } from "@models/Good";
import { IUser, FLAG as UserFlag } from "@models/User";
import newCache  = require("@utils/newCache");

export const FLAG = "collections";

export const cache = newCache(FLAG);

const Definition: SchemaDefinition = {
    name: {
        type: String,
        default: Date.now,
        trim: true
    },
    goods: [{
        type: SchemaTypes.ObjectId,
        ref: GoodFlag,
        required: true
    }],
    creator: {
        type: SchemaTypes.ObjectId,
        ref: UserFlag,
        required: true
    }
};

export interface ICollections extends IDocRaw {
    name: string;
    goods: ObjectId[] | IGoods[];
    creator: ObjectId | IUser;
}

export interface ICollectionsRaw extends ICollections {
    goods: IGoods[];
    creator: IUser;
}

export type CollectionDoc = IDoc<ICollections>;

const CollectionsSchema = new Base(Definition).createSchema();

// region validators

CollectionsSchema.path("name").validate({
    isAsync: true,
    validator: async function nameValidator(val, respond) {
        respond(await existsValidator.bind(this)(Model, "name", val));
    },
    message: "The name is existed"
});

CollectionsSchema.path("goods").validate({
    isAsync: true,
    validator: (val: string[], respond) => {
        respond(val.length !== 0);
    },
    message: "Must have Good ID"
});

CollectionsSchema.path("goods").validate({
    isAsync: true,
    validator: async (val: string[], respond) => {
        for (const v of val) {
            const good = await GoodsModels.findById(v).exec();
            if (!good) {
                return respond(false);
            }
        }
        return respond(true);
    },
    message: "Good ID is nonexist"
});
// endregion validators

for (const method of MODIFY_MOTHODS) {
    CollectionsSchema.post(method, () => {
        cache.clear();
    });
}

export const Model = model(FLAG, CollectionsSchema) as M<CollectionDoc>;
