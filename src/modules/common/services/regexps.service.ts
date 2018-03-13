import { Component, BadRequestException } from "@nestjs/common";
import { ObjectId } from "@models/common";
import {
    Model as RegexpsModel, cache, RegexpDoc, IRegexpDoc
} from "@models/Regexp";
import { Model as CategroiesModel, ICategory } from "@models/Categroy";
import { DEF_PER_COUNT } from "@dtos/page";
import { isUndefined } from "util";
import { BaseService, IGetOptions } from "@services/base";

export interface IGetRegexpsOptions {
    categroies?: ObjectId[];
    appends?: ObjectId[];
}

@Component()
export class RegexpsService extends BaseService {

    constructor() {
        super();
        super.setCache(cache);
        // Update
        setTimeout(() => {
            // Add Hidden Label
            RegexpsModel.update(
                { hidden: { $exists: false } }, { hidden: false },
                { multi: true }
            ).exec();
        }, 3000);
    }

    /**
     * 新增规则
     */
    public async create(obj: IRegexpDoc) {
        try {
            return await RegexpsModel.create(obj);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    /**
     * 修改规则
     * @param id Regexp ID
     */
    public async editById(id: ObjectId, obj: object) {
        try {
            return await RegexpsModel
                .update({ _id: id }, obj, this.DEF_UPDATE_OPTIONS)
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
            return await RegexpsModel
                .update({ _id: id }, { link: linkId }, this.DEF_UPDATE_OPTIONS)
                .exec();
        } catch (error) {
            throw new BadRequestException(error.toSrting());
        }
    }

    public count() {
        const FLAG = "totalCount";
        return this.loadAndCache(
            FLAG,
            () => RegexpsModel.count({ }).exec()
        );
    }

    public getById(id: ObjectId, opts?: IGetOptions) {
        let p = RegexpsModel.findById(id)
            .populate({ path: "link", populate: { path: "pid" } });
        p = this.documentQueryProcess(p, opts);
        return p.exec();
    }

    /**
     * 规则列表
     * @param  perNum {number} 每页数量
     * @param  page {number} 页数
     * @return {Promise}
     */
    public list(
        perNum = this.DEF_PER_OBJ.perNum, page = this.DEF_PER_OBJ.page
    ) {
        const FLAG = `list_${perNum}_${page}`;
        return this.loadAndCache(
            FLAG,
            () => RegexpsModel.find({ })
                .skip((page - 1) * perNum).limit(perNum)
                .populate("link").exec(),
            3000
        );
    }

    private getRegexps(opts: IGetRegexpsOptions = { }) {
        const DEF_CONDITIONS = {
            link: { $exists: true }, hidden: false
        };

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
                () => RegexpsModel.find(conditions).populate("link").exec(),
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
                () => RegexpsModel.find(conditions).populate("link").exec(),
                3000
            );
        } else {
            const FLAG = "default_scan_regexps";
            return this.loadAndCache(
                FLAG,
                () => RegexpsModel.find(DEF_CONDITIONS).populate("link").exec(),
                3000
            );
        }
    }

    /**
     * 根据规则进行识别
     * @return {Promise}
     */
    public async discern(name: string, opts?: IGetRegexpsOptions) {
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
