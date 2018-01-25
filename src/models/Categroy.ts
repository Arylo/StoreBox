import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import { Base, IDoc, IDocRaw, ObjectId, MODIFY_MOTHODS } from "@models/common";
import { IValues, Flag as ValueFlag } from "@models/Value";
import { isArray } from "util";
import { reduce, includes, difference } from "lodash";
import { MongoError } from "mongodb";
import Cache =  require("schedule-cache");

const cache = Cache.create();

export const FLAG = "categories";
export type CategoryDoc = IDoc<ICategory>;

const Definition: SchemaDefinition = {
    name: { type: String, required: true, unique: true },
    tags: [ String ],
    attributes: [{
        type: SchemaTypes.ObjectId,
        ref: ValueFlag
    }],
    pid: {
        type: SchemaTypes.ObjectId,
        ref: FLAG
    }
};

export interface ICategory extends IDocRaw {
    name: string;
    tags: string[];
    attributes: [ ObjectId ] | [ IValues ];
    pid: ObjectId | ICategory;
}

export interface ICategoryRaw extends ICategory {
    attributes: [ IValues ];
    pid: ICategoryRaw;
}

const CategorySchema = new Base(Definition).createSchema();

const getIdGroups = (obj): string[] => {
    const selfIdArr = [ obj._id.toString() ];
    if (obj.pid) {
        if (obj.pid._id) {
            return selfIdArr.concat(getIdGroups(obj.pid));
        } else {
            return selfIdArr.concat(obj.pid.toString());
        }
    } else {
        return selfIdArr;
    }
};

CategorySchema.static("moveCategory", async (id: ObjectId, pid: ObjectId) => {
    const curCate = await Model.findById(id)
        .exec();
    const parentCate = await Model.findById(pid)
        .select("_id pid")
        .populate({
            path: "pid", populate: { path: "pid", select: "pid" }, select: "pid"

        })
        .exec();
    if (!curCate || !parentCate) {
        return Promise.reject(
            new MongoError("The ID Category isnt exist")
        );
    }

    const idSet = new Set(getIdGroups(parentCate.toObject()));
    if (idSet.size !== 1 && idSet.has(curCate._id.toString())) {
        return Promise.reject(
            new MongoError("It would bad loop, if set the Parent Category")
        );
    }
    return Model.findByIdAndUpdate(id, {
        pid: pid
    }).exec();
});

CategorySchema.static("getCategories", async (tags: string | string[] = [ ]) => {
    if (!isArray(tags)) {
        tags = [ tags ];
    }
    if (tags.length === 0) {
        return Promise.resolve([ ]);
    }
    const conditions = tags.length === 1 ? {
        tags: { $in: tags }
    } : {
        $or: reduce(tags, (arr, tag) => {
            arr.push({ tags: { $in: [ tag ] } });
            return arr;
        }, [])
    };
    const p = (await Model.find(conditions)
        .populate({ path: "pid", populate: { path: "pid" } })
        .populate("attributes")
        .exec())
        .map((item) => item.toObject())
        .map((item) => {
            item.tags = Array.from(new Set(getTags(item)));
            delete item.pid;
            return item;
        })
        .filter((item) => {
            const diffLength = difference(item.tags, tags).length;
            return diffLength + tags.length === item.tags.length ;
        });
    return p;
});

export interface ICategoryModel<T extends CategoryDoc> extends M<T> {
    moveCategory(id: ObjectId, pid: ObjectId): Promise<T>;
    getCategories(tags: string | string[]): Promise<ICategoryRaw[]>;
}

for (const method of MODIFY_MOTHODS) {
    CategorySchema.post(method, () => {
        cache.clear();
    });
}

export const Model = model(FLAG, CategorySchema) as ICategoryModel<CategoryDoc>;

const getTags = (obj: ICategoryRaw | ICategory) => {
    const tags = obj.tags;
    const pid = obj.pid as ICategoryRaw | void;
    if (pid && pid.tags) {
        return tags.concat(getTags(pid));
    }
    return tags;
};
