import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import { Base, IDoc, IDocRaw, ObjectId, MODIFY_MOTHODS } from "@models/common";
import { IValues, Flag as ValueFlag } from "@models/Value";
import { IUser, FLAG as UserFlag } from "@models/User";
import { ICategory, FLAG as CategoryFlag } from "@models/Categroy";
import { DEF_PER_COUNT } from "@dtos/page";
import Cache =  require("schedule-cache");
import { isArray } from "util";
import { reduce } from "lodash";

const cache = Cache.create(`${Date.now()}${Math.random()}`);

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

// region validators
GoodsSchema.path("md5sum").validate({
    isAsync: true,
    validator: (val, respond) => {
        Model.findOne({ md5sum: val }).exec().then((result) => {
            respond(result ? false : true);
        });
    },
    message: "The file is existed"
});

GoodsSchema.path("sha256sum").validate({
    isAsync: true,
    validator: (val, respond) => {
        Model.findOne({ sha256sum: val }).exec().then((result) => {
            respond(result ? false : true);
        });
    },
    message: "The file is existed"
});
// endregion validators

const getConditionsByUids = (uids: ObjectId[]) => {
    let conditions;
    switch (uids.length) {
        case 0:
            conditions = { };
            break;
        case 1:
            conditions = {
                uploader: uids[0]
            };
            break;
        default:
            conditions = {
                $or: reduce(uids, (arr, uid) => {
                    arr.push({ uploader: uid });
                    return arr;
                }, [])
            };
            break;
    }
    return conditions;
};

GoodsSchema.static(
    "getGoodsByUids",
    (uids: ObjectId | ObjectId[], perNum = DEF_PER_COUNT, page = 1) => {
        if (!isArray(uids)) {
            uids = [ uids ];
        }
        const conditions = getConditionsByUids(uids);
        return Model.find(conditions)
            .skip((page - 1) * perNum).limit(perNum)
            .select("-uploader")
            .populate("attributes")
            .sort({ updatedAt: -1 })
            .exec();
    }
);

GoodsSchema.static(
    "countGoodsByUids",
    async (uids: ObjectId | ObjectId[], perNum = 1) => {
        if (!isArray(uids)) {
            uids = [ uids ];
        }
        const flag = `count_uids_${uids.join("_")}_${perNum}`;
        const count = cache.get(flag);
        if (count) {
            return count;
        }
        const conditions = getConditionsByUids(uids);
        const total = await Model.count(conditions).exec();
        cache.put(flag, Math.ceil(total / perNum));
        return cache.get(flag);
    }
);

const getConditionsByCids = (cids: ObjectId[]) => {
    return cids.length === 1 ? {
        category: cids[0],
        active: true
    } : {
        $or: reduce(cids, (arr, cid) => {
            arr.push({ category: { $in: [ cid ] } });
            return arr;
        }, []),
        active: true
    };
};

GoodsSchema.static(
    "getGoodsByCids",
    (cids: ObjectId | ObjectId[], perNum = DEF_PER_COUNT, page = 1) => {
        if (!isArray(cids)) {
            cids = [ cids ];
        }
        const conditions = getConditionsByCids(cids);
        return Model.find(conditions)
            .skip((page - 1) * perNum).limit(perNum)
            .populate("uploader attributes")
            .sort({ updatedAt: -1 })
            .exec();
    }
);

GoodsSchema.static(
    "countGoodsByCids",
    async (cids: ObjectId | ObjectId[], perNum = 1) => {
        if (!isArray(cids)) {
            cids = [ cids ];
        }
        if (cids.length === 0) {
            return [ ];
        }
        const flag = `count_cids_${cids.join("_")}_${perNum}`;
        const count = cache.get(flag);
        if (count) {
            return count;
        }
        const conditions = getConditionsByCids(cids);
        const total = await Model.count(conditions).exec();
        cache.put(flag, Math.ceil(total / perNum));
        return cache.get(flag);
    }
);

export interface IGoodModel<T extends GoodDoc> extends M<T> {
    // By UID
    getGoodsByUids(
        uids: ObjectId | ObjectId[], perNum?: number, page?: number
    ): Promise<T[]>;
    countGoodsByUids(
        uids: ObjectId | ObjectId[], perNum?: number
    ): Promise<number>;
    // By CIDs
    getGoodsByCids(
        cids: ObjectId | ObjectId[], perNum?: number, page?: number
    ): Promise<T[]>;
    countGoodsByCids(
        cids: ObjectId | ObjectId[], perNum?: number
    ): Promise<number>;
}

for (const method of MODIFY_MOTHODS) {
    GoodsSchema.post(method, () => {
        cache.clear();
    });
}

export const Model = model(FLAG, GoodsSchema) as IGoodModel<GoodDoc>;
