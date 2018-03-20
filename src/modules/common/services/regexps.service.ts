import { Component, BadRequestException } from "@nestjs/common";
import { ObjectId } from "@models/common";
import {
    Model as RegexpsModel, cache, RegexpDoc, IRegexpDoc, IRegexp
} from "@models/Regexp";
import { Model as CategroiesModel, ICategory } from "@models/Categroy";
import { DEF_PER_COUNT } from "@dtos/page";
import { isArray } from "util";
import { BaseService, IGetOptions } from "@services/base";

export interface IGetRegexpsOptions {
    categroies?: ObjectId[];
    appends?: ObjectId[];
}

@Component()
export class RegexpsService extends BaseService<IRegexp> {

    constructor() {
        super();
        this.setCache(cache);
        this.setModel(RegexpsModel);
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
        return super.create(obj);
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
        const FLAG = "total";
        return this.loadAndCache(
            FLAG,
            () => RegexpsModel.count({ }).exec()
        );
    }

    public get(conditions: object, opts?: IGetOptions) {
        return this.find(conditions, opts);
    }

    public async getById(id: ObjectId, opts?: IGetOptions) {
        const extraPopulate = { path: "link", populate: { path: "pid" } };
        if (!opts) {
            opts = { };
        }
        if (opts.populate && isArray(opts.populate)) {
            opts.populate.push(extraPopulate);
        } else {
            opts.populate = [ extraPopulate ];
        }
        return (await this.get({ _id: id }, opts))[0];
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
            () => this.findObjects({ }, {
                perNum, page,
                populate: "link"
            }),
            1000
        );
    }

    private getRegexps(opts: IGetRegexpsOptions = { }) {
        const DEF_CONDITIONS = {
            link: { $exists: true }, hidden: false
        };
        const DEF_OPTIONS = {
            populate: [ "link" ]
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
                FLAG, () => this.findObjects(conditions, DEF_OPTIONS), 1000
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
                FLAG, () => this.findObjects(conditions, DEF_OPTIONS), 1000
            );
        } else {
            const FLAG = "default_scan_regexps";
            return this.loadAndCache(
                FLAG, () => this.findObjects(DEF_CONDITIONS, DEF_OPTIONS), 1000
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
            const obj = item;
            const reg = new RegExp(obj.value);
            if (reg.test(name)) {
                list.push(obj.link);
            }
        });
        return list as ICategory[];
    }

}
