import { DEF_PER_COUNT } from "@dtos/page";
import { UtilService } from "@services/util";

type TimeType = number | string;

export abstract class BaseService {

    private cache;

    protected setCache(cache) {
        // this.cache = cache;
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

}
