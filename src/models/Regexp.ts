import { DEF_PER_COUNT } from "@dtos/page";
import { FLAG as CF, ICategory, Model as CM } from "@models/Categroy";
import {
    Base, existsValidator, IDoc, IDocRaw, MODIFY_MOTHODS, ObjectId
} from "@models/common";
import isRegExp = require("@utils/isRegExp");
import newCache  = require("@utils/newCache");
import { model, Model as M, SchemaDefinition, SchemaTypes } from "mongoose";

import { INewRegexp } from "../modules/admin/regexps/regexps.dto";

export const FLAG = "regexps";

export const cache = newCache(FLAG);

const Definition: SchemaDefinition = {
    name: { type: String, required: true, unique: true },
    value: { type: String, required: true },
    link: {
        type: SchemaTypes.ObjectId,
        ref: CF
    },
    hidden: { type: Boolean, default: false }
};

export interface IRegexp extends IDocRaw {
    name: string;
    value: string;
    link: ObjectId | ICategory;
    hidden: boolean;
}

export interface IRegexpsRaw extends IRegexp {
    link: ICategory;
}

export interface IRegexpDoc {
    name: string;
    value: string;
    link?: ObjectId;
    hidden?: boolean;
}

export type RegexpDoc = IDoc<IRegexp>;

const RegexpSchema = new Base(Definition).createSchema();

// region static methods
RegexpSchema.static(
    "addRegexp",
    (name: string, value: string, link?: ObjectId) => {
        const obj: INewRegexp = {
            name: name,
            value: value
        };
        if (link) {
            obj.link = link;
        }
        return Model.create(obj);
    }
);

RegexpSchema.static("removeRegexp", (id: ObjectId) => {
    return Model.findByIdAndRemove(id).exec();
});

// endregion static methods

interface IRegexpModel<T extends RegexpDoc> extends M<T> {
    /**
     * 创建新规则
     * @return {Promise}
     */
    addRegexp(name: string, value: string, link?: ObjectId): Promise<T>;
    /**
     * 移除规则
     * @return {Promise}
     */
    removeRegexp(id: ObjectId): Promise<T>;
}

// region Validators
RegexpSchema.path("name").validate({
    isAsync: true,
    validator: async function nameExistValidator(value, respond) {
        return respond(await existsValidator.bind(this)(
            Model, "name", value
        ));
    },
    message: "The name is exist"
});

RegexpSchema.path("value").validate({
    isAsync: true,
    validator: (value, respond) => {
        return respond(isRegExp(value));
    },
    message: "The value isnt Regexp"
});

RegexpSchema.path("value").validate({
    isAsync: true,
    validator: async function valueExistValidator(value, respond) {
        if (this && this.hidden) {
            return respond(true);
        }
        return respond(await existsValidator.bind(this)(
            Model, "value", value, { extraCond: { hidden: false } }
        ));
    },
    message: "The value is exist"
});

RegexpSchema.path("link").validate({
    isAsync: true,
    validator: async (value, respond) => {
        const result = await CM.findById(value).exec();
        return respond(!!result);
    },
    message: "The Category ID is not exist"
});

RegexpSchema.path("hidden").validate({
    isAsync: true,
    validator: async function hiddenExistValidator(value, respond) {
        if (!value) { // hidden === false
            return respond(true);
        }
        respond(await existsValidator.bind(this)(
            Model, "hidden", value, { extraCond: { value: this.value } }
        ));
    },
    message: "Only one active item with every value"
});
// endregion Validators

for (const method of MODIFY_MOTHODS) {
    RegexpSchema.post(method, () => {
        cache.clear();
    });
}

export const Model = model(FLAG, RegexpSchema) as IRegexpModel<RegexpDoc>;
