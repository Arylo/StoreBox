import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import { Base, IDoc, IDocRaw, ObjectId, MODIFY_MOTHODS } from "@models/common";
import { IGoods, FLAG as GoodFlag, Model as GoodsModels } from "@models/Good";
import { IUser, FLAG as UserFlag } from "@models/User";
import Cache =  require("schedule-cache");

export const FLAG = "collections";

export const cache = Cache.create(`${Date.now()}${Math.random()}`);

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
        if (!this.isNew) {
            const id = this.getQuery()._id;
            const col = await Model.findById(id).exec();
            if (col.toObject().name === val) {
                return respond(true);
            }
        }
        const result = await Model.findOne({ name: val }).exec();
        respond(result ? false : true);
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

export const Model = model(FLAG, CollectionsSchema) as M<CollectionDoc>;
