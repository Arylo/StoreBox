import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import { Base, IDoc, IDocRaw, ObjectId, MODIFY_MOTHODS } from "@models/common";
import { ICategory, FLAG as CF, Model as CM } from "@models/Categroy";
import { DEF_PER_COUNT } from "@dtos/page";
import Cache =  require("schedule-cache");
import isRegExp = require("@utils/isRegExp");

export const cache = Cache.create(`${Date.now()}${Math.random()}`);

const Definition: SchemaDefinition = {
    name: { type: String, required: true, unique: true },
    value: { type: String, required: true, unique: true },
    link: {
        type: SchemaTypes.ObjectId,
        ref: CF
    }
};

export interface IRegexp extends IDocRaw {
    name: string;
    value: string;
    link: ObjectId | ICategory;
}

export interface IRegexpsRaw extends IRegexp {
    link: ICategory;
}

export type RegexpDoc = IDoc<IRegexp>;

const RegexpSchema = new Base(Definition).createSchema();

// region static methods
RegexpSchema.static("countRegexps", async (perNum = 1) => {
    const FLAG = `page_count_${perNum}`;
    if (cache.get(FLAG)) {
        return cache.get(FLAG);
    }
    cache.put(FLAG, Math.ceil((await Model.count({ }).exec()) / perNum));
    return cache.get(FLAG);
});

RegexpSchema.static("addRegexp", (name: string, value: string) => {
    return Model.create({
        name: name,
        value: value
    }).then((result) => {
        cache.clear();
        return result;
    });
});

RegexpSchema.static("removeRegexp", (id: ObjectId) => {
    return Model.findByIdAndRemove(id).exec();
});

RegexpSchema.static("link", (id: ObjectId, linkId: ObjectId | false) => {
    if (!linkId) {
        return Model.findByIdAndUpdate(id, {
            "$unset": { link: 0 }
        }).exec();
    } else {
        return Model.findByIdAndUpdate(
            id, { link: linkId }, { runValidators: true }
        ).exec();
    }
});

RegexpSchema.static("list", (perNum = DEF_PER_COUNT, page = 1) => {
    const FLAG_LIST = `list_${perNum}_${page}`;
    if (cache.get(FLAG_LIST)) {
        return cache.get(FLAG_LIST);
    }
    cache.put(
        FLAG_LIST,
        Model.find({ })
            .skip((page - 1) * perNum).limit(perNum)
            .populate("link").exec()
    );
    return cache.get(FLAG_LIST);
});

RegexpSchema.static("discern", (name: string) => {
    const FLAG_DISCER_LIST = "discern";
    let p: Promise<RegexpDoc[]>;
    if (cache.get(FLAG_DISCER_LIST)) {
        p = cache.get(FLAG_DISCER_LIST);
    } else {
        p = Model.find({ link: { $exists: true } })
            .populate("link")
            .exec();
        cache.put(FLAG_DISCER_LIST, p);
    }
    return p.then((result) => {
        const list = [ ];
        result.forEach((item) => {
            const obj = item.toObject();
            const reg = new RegExp(obj.value);
            if (reg.test(name)) {
                list.push(obj.link);
            }
        });
        return list;
    });
});
// endregion static methods

export const FLAG = "regexps";

interface IRegexpModel<T extends RegexpDoc> extends M<T> {
    /**
     * 创建新规则
     * @return {Promise}
     */
    addRegexp(name: string, value: string): Promise<T>;
    /**
     * 移除规则
     * @return {Promise}
     */
    removeRegexp(id: ObjectId): Promise<T>;
    /**
     * 规则关联
     * @return {Promise}
     */
    link(id: ObjectId, linkId: ObjectId | false): Promise<T>;
    /**
     * 规则列表
     * @param  perNum {number} 每页数量
     * @param  page {number} 页数
     * @return {Promise}
     */
    list(perNum?: number, page?: number): Promise<T[]>;
    /**
     * 根据规则进行识别
     * @return {Promise}
     */
    discern(filename: string): Promise<ICategory[]>;
    /**
     * 返回总页数
     */
    countRegexps(perNum?: number): Promise<number>;
}

// region Validators
RegexpSchema.path("name").validate({
    isAsync: true,
    validator: async (value, respond) => {
        const result = await Model.findOne({ name: value }).exec();
        return !result;
    },
    message: "The name is exist"
});

RegexpSchema.path("value").validate({
    isAsync: true,
    validator: (value, respond) => {
        return isRegExp(value);
    },
    message: "The value isnt Regexp"
});

RegexpSchema.path("value").validate({
    isAsync: true,
    validator: async (value, respond) => {
        const result = await Model.findOne({ value: value }).exec();
        return !result;
    },
    message: "The value is exist"
});

RegexpSchema.path("link").validate({
    isAsync: true,
    validator: async (value, respond) => {
        const result = await CM.findById(value).exec();
        return !!result;
    },
    message: "The Category ID is not exist"
});
// endregion Validators

for (const method of MODIFY_MOTHODS) {
    RegexpSchema.post(method, () => {
        cache.clear();
    });
}

export const Model = model(FLAG, RegexpSchema) as IRegexpModel<RegexpDoc>;
