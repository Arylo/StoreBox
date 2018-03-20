import { BadGatewayException, BadRequestException } from "@nestjs/common";
import { isString } from "util";
import { DEF_PER_COUNT } from "@dtos/page";
import { UtilService } from "@services/util";
import {
    DocumentQuery, ModelPopulateOptions, Model, ModelUpdateOptions
} from "mongoose";
import keyv = require("keyv");
import isPromise = require("is-promise");
import { IDocRaw, IDoc, ObjectId } from "@models/common";

export interface IGetOptions {
    populate?: string | Array<string | ModelPopulateOptions>;
    select?: string | string[];
    perNum?: number;
    page?: number;
    sort?: string | object;
}

abstract class ModelService<D extends IDocRaw> {

    protected readonly DEF_UPDATE_OPTIONS: ModelUpdateOptions = {
        runValidators: true, context: "query"
    };
    private model: Model<IDoc<D>>;

    protected setModel<M extends Model<IDoc<D>>>(model: M) {
        this.model = model;
    }

    private checkModel() {
        if (!this.model) {
            throw new BadGatewayException("Lost Model");
        }
    }

    public async create(obj: object) {
        this.checkModel();
        try {
            return await this.model.create(obj);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public async delete(cond: object) {
        this.checkModel();
        try {
            return await this.model.findOneAndRemove(cond).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public async deleteById(id: ObjectId) {
        this.checkModel();
        try {
            return await this.model.findByIdAndRemove(id).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public async modifyById(
        id: ObjectId, ctx: object, opts = this.DEF_UPDATE_OPTIONS
    ) {
        this.checkModel();
        const options = Object.assign({ }, this.DEF_UPDATE_OPTIONS, opts);
        try {
            return await this.model.update({ _id: id }, ctx, options).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    protected find(cond: object, opts?: IGetOptions) {
        this.checkModel();
        const p = this.model.find(cond);
        return this.documentQueryProcess(p, opts).exec();
    }

    protected findObjects(cond: object, opts?: IGetOptions) {
        return this.find(cond, opts).then((arr) => {
            return arr.map((item) => item.toObject());
        });
    }

    protected findOne(cond: object, opts?: IGetOptions) {
        this.checkModel();
        const p = this.model.findOne(cond);
        return this.documentQueryProcess(p, opts).exec();
    }

    protected findObject(cond: object, opts?: IGetOptions) {
        return this.findOne(cond, opts).then((item) => {
            return !item ? null : item.toObject();
        });
    }

    protected findById(id: ObjectId, opts?: IGetOptions) {
        this.checkModel();
        const p = this.model.findById(id);
        return this.documentQueryProcess(p, opts).exec();
    }

    protected findObjectById(id: ObjectId, opts?: IGetOptions) {
        return this.findById(id, opts).then((item) => {
            return !item ? null : item.toObject();
        });
    }

    protected total(cond: object = { }) {
        this.checkModel();
        return this.model.count(cond).exec();
    }

    private documentQueryProcess<T extends DocumentQuery<any, any>>(
        query: T, opts: IGetOptions = { }
    ) {
        if (opts.sort) {
            query = query.sort(opts.sort);
        }
        if (isString(opts.populate)) {
            opts.populate = [ opts.populate ];
        }
        for (const p of (opts.populate || [ ])) {
            query = query.populate(p);
        }
        if (isString(opts.select)) {
            opts.select = [ opts.select ];
        }
        for (const s of (opts.select || [ ])) {
            query = query.select(s);
        }
        if (opts.perNum && opts.page) {
            query = query
                .skip((opts.page - 1) * opts.perNum)
                .limit(opts.perNum);
        }
        return query;
    }
}

export abstract class BaseService<D extends IDocRaw = IDocRaw> extends ModelService<D> {

    private cache: keyv;

    protected setCache(cache: keyv) {
        this.cache = cache;
    }

    protected async loadAndCache<T>(
        FLAG: string, value: () => Promise<T>, time?: number
    ): Promise<T>;
    protected async loadAndCache<T>(
        FLAG: string, value: () => T, time = 1000 * 60 * 5 // 5 min
    ): Promise<T> {
        if (!this.cache) {
            return value();
        }
        const c: T = await this.cache.get(FLAG);
        if (c) {
            return c;
        }
        let val = value();
        if (isPromise(val)) {
            val = await val;
        }
        await this.cache.set(FLAG, val, time);
        return val;
    }

    protected DEF_PER_OBJ = UtilService.DEF_PER_OBJ;

    /**
     * 计算页数
     * @param total 总数
     * @param perNum 每页显示数
     */
    public calPageCount = UtilService.calPageCount;

    protected total(cond: object = { }) {
        const flag = Object.keys(cond).sort().reduce((f, key) => {
            return `${f}_${key}_${cond[key].toString()}`;
        }, "total");
        return this.loadAndCache(
            flag, () => super.total(cond)
        );
    }

}
