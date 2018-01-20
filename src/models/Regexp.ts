import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import { Base, IDoc, IDocRaw, ObjectId } from "@models/common";
import { ICategroy, Flag as CF, Model as CM } from "@models/Categroy";
import Cache =  require("schedule-cache");
import { PER_COUNT } from "../modules/common/dtos/page.dto";
const cache = Cache.create();

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
    link: ObjectId | ICategroy;
}

export interface IRegexpsRaw extends IRegexp {
    link: ICategroy;
}

export type RegexpDoc = IDoc<IRegexp>;

const RegexpSchema = new Base(Definition).createSchema();

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
    cache.clear();
    return Model.findByIdAndRemove(id).exec();
});

RegexpSchema.static("link", (id: ObjectId, linkId: ObjectId | false) => {
    cache.clear();
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

RegexpSchema.static("list", (perNum = PER_COUNT[0], page = 1) => {
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

export const Flag = "regexps";

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
    discern(filename: string): Promise<ICategroy[]>;
}

export const Model = model(Flag, RegexpSchema) as IRegexpModel<RegexpDoc>;

Model.schema.path("name").validate({
    isAsync: true,
    validator: async (value, respond) => {
        const result = await Model.findOne({ name: value }).exec();
        return !result;
    },
    message: "The name is exist"
});

Model.schema.path("value").validate({
    isAsync: true,
    validator: async (value, respond) => {
        const result = await Model.findOne({ value: value }).exec();
        return !result;
    },
    message: "The value is exist"
});

Model.schema.path("link").validate({
    isAsync: true,
    validator: async (value, respond) => {
        const result = await CM.findById(value).exec();
        return !!result;
    },
    message: "The Categroy ID is not exist"
});
