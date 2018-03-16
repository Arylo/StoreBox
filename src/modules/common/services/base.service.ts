import { DEF_PER_COUNT } from "@dtos/page";
import { UtilService } from "@services/util";
import { DocumentQuery, ModelPopulateOptions } from "mongoose";

type TimeType = number | string;

export interface IGetOptions {
    populate?: Array<string | ModelPopulateOptions>;
    select?: string[];
}

export abstract class BaseService {

    protected readonly DEF_UPDATE_OPTIONS = {
        runValidators: true, context: "query"
    };
    private cache;

    protected setCache(cache) {
        this.cache = cache;
    }

    protected loadAndCache<T>(
        FLAG: string, value: () => T, time?: TimeType
    ): T {
        if (!this.cache) {
            return value();
        }
        const c = this.cache.get(FLAG);
        if (c) {
            return c;
        }
        const val = value();
        if (time) {
            this.cache.put(FLAG, val, time);
        } else {
            this.cache.put(FLAG, val);
        }
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
