import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import { Base, IDoc, IDocRaw, ObjectId, MODIFY_MOTHODS } from "@models/common";
import { IValues, Flag as ValueFlag } from "@models/Value";
import { IUser, Flag as UserFlag } from "@models/User";
import { ICategory, FLAG as CategoryFlag } from "@models/Categroy";
import Cache =  require("schedule-cache");
import { PER_COUNT } from "../modules/common/dtos/page.dto";
import { isArray } from "util";
import { reduce } from "lodash";

const cache = Cache.create();

export const FLAG = "goods";
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

GoodsSchema.static(
    "getGoods",
    (cids: ObjectId | ObjectId[], perNum = PER_COUNT[0], page = 1) => {
        if (!isArray(cids)) {
            cids = [ cids ];
        }
        const conditions = cids.length === 1 ? {
            category: cids[0],
            active: true
        } : {
            $or: reduce(cids, (arr, cid) => {
                arr.push({ category: { $in: [ cid ] } });
                return arr;
            }, []),
            active: true
        };
        return Model.find(conditions)
            .skip((page - 1) * perNum).limit(perNum)
            .populate("uploader attributes")
            .sort({ updatedAt: -1 })
            .exec();
    }
);

GoodsSchema.static(
    "countGoods",
    async (cids: ObjectId | ObjectId[], perNum = PER_COUNT[0]) => {
        if (!isArray(cids)) {
            cids = [ cids ];
        }
        const flag = `count_${cids.join("_")}`;
        const count = cache.get(flag);
        if (count) {
            return count;
        }
        const conditions = cids.length === 1 ? {
            category: cids[0],
            active: true
        } : {
            $or: reduce(cids, (arr, cid) => {
                arr.push({ category: { $in: [ cid ] } });
                return arr;
            }, []),
            active: true
        };
        const total = await Model.count(conditions).exec();
        cache.put(flag, Math.ceil(total / perNum));
        return cache.get(flag);
    }
);

export interface IGoodModel<T extends GoodDoc> extends M<T> {
    getGoods(
        cids: ObjectId | ObjectId[], perNum?: number, page?: number
    ): Promise<T[]>;
    countGoods(
        cids: ObjectId | ObjectId[], perNum?: number
    ): Promise<number>;
}

for (const method of MODIFY_MOTHODS) {
    GoodsSchema.post(method, () => {
        cache.clear();
    });
}

export const Model = model(FLAG, GoodsSchema) as IGoodModel<GoodDoc>;
