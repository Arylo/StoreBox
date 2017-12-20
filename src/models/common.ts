import * as lodash from "lodash";
import { Schema, Document as Doc } from "mongoose";

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
