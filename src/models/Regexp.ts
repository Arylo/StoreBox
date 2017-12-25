import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import { Base, IDoc, IDocRaw, ObjectId } from "@models/common";
import { ICategroy, Flag as GTF, Model as GTM } from "@models/Categroy";
import Cache =  require("schedule-cache");
const cache = Cache.create();

const Definition: SchemaDefinition = {
    name: { type: String, required: true, unique: true },
    value: { type: String, required: true, unique: true },
    link: {
        type: SchemaTypes.ObjectId,
        ref: GTF
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
    return Model.findByIdAndRemove(id).exec();
});

RegexpSchema.static("link", (id: ObjectId, linkId: ObjectId | false) => {
    let p: Promise<RegexpDoc>;
    if (!linkId) {
        p = Model.findByIdAndUpdate(id, {
            "$unset": { link: 0 }
        }).exec();
    } else {
        p = GTM.findById(linkId).exec().then((categroy) => {
            if (!categroy) {
                return Promise.reject("The Categroy ID is not exist");
            }
            return Model.findByIdAndUpdate(id, { link: linkId }).exec();
        });
    }
    return p;
});

RegexpSchema.static("list", () => {
    const flag = "list";
    if (cache.get(flag)) {
        return cache.get(flag);
    }
    cache.put(flag, Model.find().populate("link").exec());
    return cache.get(flag);
});

RegexpSchema.static("discern", (name: string) => {
    return Model.find({ link: { $exists: true } })
        .populate("link")
        .exec()
        .then((result) => {
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
    list(): Promise<T>;
    /**
     * 根据规则进行识别
     */
    discern(name: string): Promise<ICategroy[]>;
}

export const Model = model(Flag, RegexpSchema) as IRegexpModel<RegexpDoc>;
