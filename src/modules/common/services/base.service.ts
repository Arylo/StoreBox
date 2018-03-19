import { DEF_PER_COUNT } from "@dtos/page";
import { UtilService } from "@services/util";
import { DocumentQuery, ModelPopulateOptions } from "mongoose";
import keyv = require("keyv");
import isPromise = require("is-promise");

export interface IGetOptions {
    populate?: Array<string | ModelPopulateOptions>;
    select?: string[];
}

export abstract class BaseService {

    protected readonly DEF_UPDATE_OPTIONS = {
        runValidators: true, context: "query"
    };
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

    public documentQueryProcess<T extends DocumentQuery<any, any>>(
        query: T, opts: IGetOptions = { }
    ) {
        for (const p of (opts.populate || [ ])) {
            query = query.populate(p);
        }
        for (const s of (opts.select || [ ])) {
            query = query.select(s);
        }
        return query;
    }

}
