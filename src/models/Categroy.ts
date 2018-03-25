import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import { Base, IDoc, IDocRaw, ObjectId, MODIFY_MOTHODS } from "@models/common";
import { IValues, Flag as ValueFlag } from "@models/Value";
import { DEF_PER_COUNT } from "@dtos/page";
import { isArray } from "util";
import { reduce, includes, difference } from "lodash";
import { MongoError } from "mongodb";
import newCache  = require("@utils/newCache");

export const FLAG = "categories";

export const cache = newCache(FLAG);

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

export interface ICategoryModel<T extends CategoryDoc> extends M<T> {
    moveCategory(id: ObjectId, pid: ObjectId): Promise<T>;
}

for (const method of MODIFY_MOTHODS) {
    CategorySchema.post(method, () => {
        cache.clear();
    });
}

export const Model = model(FLAG, CategorySchema) as ICategoryModel<CategoryDoc>;
