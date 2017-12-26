import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import { Base, IDoc, IDocRaw, ObjectId } from "@models/common";
import { ICategroy, Flag as CF, Model as CM } from "@models/Categroy";
import Cache =  require("schedule-cache");
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
    let p: Promise<RegexpDoc>;
    if (!linkId) {
        cache.clear();
        p = Model.findByIdAndUpdate(id, {
            "$unset": { link: 0 }
        }).exec();
    } else {
        p = CM.findById(linkId).exec().then((categroy) => {
            if (!categroy) {
                return Promise.reject("The Categroy ID is not exist");
            }
            cache.clear();
            return Model.findByIdAndUpdate(id, { link: linkId }).exec();
        });
    }
    return p;
});

RegexpSchema.static("list", () => {
    const FLAG_LIST = "list";
    if (cache.get(FLAG_LIST)) {
        return cache.get(FLAG_LIST);
    }
    cache.put(FLAG_LIST, Model.find().populate("link").exec());
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
     */
    addRegexp(name: string, value: string): Promise<T>;
    /**
     * 移除规则
     */
    removeRegexp(id: ObjectId): Promise<T>;
    /**
     * 规则关联
     */
    link(id: ObjectId, linkId: ObjectId | false): Promise<T>;
    /**
     * 规则列表
     */
    list(): Promise<T[]>;
    /**
     * 根据规则进行识别
     */
    discern(name: string): Promise<ICategroy[]>;
}

export const Model = model(Flag, RegexpSchema) as IRegexpModel<RegexpDoc>;
