import * as lodash from "lodash";
import { Document as Doc, Model as M, Schema } from "mongoose";

export type ObjectId = Schema.Types.ObjectId | string;

export interface IDocRaw {
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly __v?: string;
    readonly _id?: ObjectId;
    [key: string]: any;
}

export interface IDoc<T extends IDocRaw> extends Doc {
    toObject(): T;
}

export class Base {
    private definition = { };
    private options = {
        timestamps: true
    };

    constructor(obj?: object) {
        this.setDefinition(obj);
    }

    protected setDefinition(obj?: object): void {
        if (!lodash.isObject(obj)) {
            return;
        }
        lodash.merge(this.definition, obj);
        return;
    }

    protected setOptions(obj?: object): void {
        if (!lodash.isObject(obj)) {
            return;
        }
        lodash.merge(this.options, obj);
        return;
    }

    public createSchema() {
        return new Schema(this.definition, this.options);
    }
}

export const MODIFY_MOTHODS = [
    "save", "remove", "update",
    "findOneAndRemove", "findOneAndUpdate",
    "insertMany"
];

interface IExistsValidatorOptions {
    update?: boolean;
    extraCond?: object;
}

const existsValidatorOptions: IExistsValidatorOptions = {
    update: true
};

export const existsValidator = async function ExistsValidatorFn(
    model: M<any>, field: string, value, opts?: IExistsValidatorOptions
) {
    const options = Object.assign({ }, existsValidatorOptions, opts);
    if (options.update && this && !this.isNew) {
        const id = this.getQuery()._id;
        const col = await model.findById(id).exec();
        if (col.toObject()[field] === value) {
            return true;
        }
    }
    const cond =
        Object.assign({ }, (options.extraCond || { }), { [field]: value });
    const result = await model.findOne(cond).exec();
    return !result;
};
