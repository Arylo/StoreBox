import { Component, BadRequestException } from "@nestjs/common";
import { ObjectId } from "@models/common";
import { Model as RegexpsModel, cache, RegexpDoc } from "@models/Regexp";
import { Model as CategroiesModel, ICategory } from "@models/Categroy";
import { DEF_PER_COUNT } from "@dtos/page";

interface IGetRegexpsOptions {
    categroies?: ObjectId[];
    appends?: ObjectId[];
}

@Component()
export class RegexpsService {

    private loadAndCache(FLAG: string, value: any, time?: number | string) {
        if (!cache.get(FLAG)) {
            cache.put(FLAG, value, time);
        }
        return cache.get(FLAG);
    }

    /**
     * 新增规则
     */
    public async create(obj) {
        try {
            return await RegexpsModel.create(obj);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    /**
     * 修改规则
     */
    public async editById(id: ObjectId, obj) {
        try {
            return await RegexpsModel
                .findByIdAndUpdate(id, obj, { runValidators: true })
                .exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    /**
     * 删除规则
     */
    public async remove(id: ObjectId) {
        try {
            return await RegexpsModel.findByIdAndRemove(id).exec();
        } catch (error) {
            throw new BadRequestException(error.toSrting());
        }
    }

    /**
     * 规则关联
     * @return {Promise}
     */
    public async link(id: ObjectId, linkId?: ObjectId) {
        if (!linkId) {
            try {
                return await RegexpsModel.findByIdAndUpdate(id, {
                    "$unset": { link: 0 }
                }).exec();
            } catch (error) {
                throw new BadRequestException(error.toSrting());
            }
        }
        if (!(await CategroiesModel.findById(linkId).exec())) {
            throw new BadRequestException("Nonexist Categroy ID");
        }
        try {
            return await RegexpsModel.findByIdAndUpdate(
                id, { link: linkId }, { runValidators: true }
            ).exec();
        } catch (error) {
            throw new BadRequestException(error.toSrting());
        }
    }

    public async pageCount(perNum = 1): Promise<number> {
        const FLAG = `pageCount_${perNum}`;
        return this.loadAndCache(
            FLAG,
            Math.ceil((await this.count()) / perNum),
            3000
        );
    }

    public count(): Promise<number> {
        const FLAG = "totalCount";
        return this.loadAndCache(
            FLAG,
            CategroiesModel.count({ }).exec(),
            3000
        );
    }

    /**
     * 规则列表
     * @param  perNum {number} 每页数量
     * @param  page {number} 页数
     * @return {Promise}
     */
    public async list(perNum = DEF_PER_COUNT, page = 1): Promise<RegexpDoc[]> {
        const FLAG = `list_${perNum}_${page}`;
        return this.loadAndCache(
            FLAG,
            RegexpsModel.find({ })
                .skip((page - 1) * perNum).limit(perNum)
                .populate("link").exec(),
            3000
        );
    }

    private async getRegexps(opts: IGetRegexpsOptions): Promise<RegexpDoc[]> {
        const DEF_CONDITIONS = { link: { $exists: true }, hidden: false };
        if (opts.categroies && opts.categroies.length > 0) {
            // 指定Categroy
            const FLAG = `categroies_scan_regexps_${opts.categroies.join("_")}`;
            const conditions = {
                $or: opts.categroies.reduce((arr, item) => {
                    arr.push({ link: item });
                    return arr;
                }, [ ])
            };
            return this.loadAndCache(
                FLAG,
                RegexpsModel.find(conditions).populate("link").exec(),
                3000
            );
        } else if (opts.appends && opts.appends.length > 0) {
            // 追加Categroy
            const FLAG = `appends_scan_regexps_${opts.appends.join("_")}`;
            const conditions = {
                $or: opts.appends.reduce((arr: any, item) => {
                    arr.push({ link: item });
                    return arr;
                }, [ DEF_CONDITIONS ])
            };
            return this.loadAndCache(
                FLAG,
                RegexpsModel.find(conditions).populate("link").exec(),
                3000
            );
        } else {
            const FLAG = "default_scan_regexps";
            return this.loadAndCache(
                FLAG,
                RegexpsModel.find(DEF_CONDITIONS).populate("link").exec(),
                3000
            );
        }
    }

    /**
     * 根据规则进行识别
     * @return {Promise}
     */
    public async discern(name: string, opts: IGetRegexpsOptions) {
        const result = await this.getRegexps(opts);
        const list = [ ];
        result.forEach((item) => {
            const obj = item.toObject();
            const reg = new RegExp(obj.value);
            if (reg.test(name)) {
                list.push(obj.link);
            }
        });
        return list as ICategory[];
    }

}
