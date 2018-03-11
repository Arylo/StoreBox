type TimeType = number | string;

export abstract class BaseService {

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

}
