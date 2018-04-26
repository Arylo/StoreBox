import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import { Base, IDoc, IDocRaw, ObjectId, MODIFY_MOTHODS, existsValidator } from "@models/common";
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

// region Validators
CategorySchema.path("name").validate({
    isAsync: true,
    validator: async function nameExistValidator(value, respond) {
        return respond(await existsValidator.bind(this)(
            Model, "name", value
        ));
    },
    message: "The name is exist"
});
// endregion Validators

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

for (const method of MODIFY_MOTHODS) {
    CategorySchema.post(method, () => {
        cache.clear();
    });
}

export const Model = model(FLAG, CategorySchema) as M<CategoryDoc>;
