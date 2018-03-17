import { Component, BadRequestException } from "@nestjs/common";
import { ObjectId } from "@models/common";
import { Model as GoodsModels, IGoods, IGoodsRaw } from "@models/Good";
import { ICategory } from "@models/Categroy";
import { Model as ValuesModel } from "@models/Value";
import { BaseService, IGetOptions } from "@services/base";
import { isArray, isObject, isString } from "util";
import { config } from "@utils/config";
import fs = require("fs-extra");

@Component()
export class GoodsService extends BaseService {

    private getConditionsByCids(cids: ObjectId[]) {
        return cids.length === 1 ? {
            category: cids[0],
            active: true
        } : {
            $or: cids.reduce((arr, cid) => {
                arr.push({ category: { $in: [ cid ] } });
                return arr;
            }, [ ]),
            active: true
        };
    }

    public get(cond: object, opts?: IGetOptions) {
        let p = GoodsModels.find(cond);
        p = this.documentQueryProcess(p, opts);
        return p.exec();
    }

    public listByCategoryId(cid: ObjectId, pageObj = this.DEF_PER_OBJ) {
        return this.loadAndCache(
            `list_category_${cid.toString()}`,
            () => GoodsModels.find({ category: cid })
                .populate("uploader")
                .populate("attributes")
                .select("-category")
                .exec(),
            50
        );
    }

    public async countByCids(cids: ObjectId | ObjectId[]) {
        if (!isArray(cids)) {
            cids = [ cids ];
        }
        if (cids.length === 0) {
            return [ ];
        }
        const conditions = this.getConditionsByCids(cids);
        return await GoodsModels.count(conditions).exec();
    }

    public async countByUids(
        uids: ObjectId | ObjectId[], perNum = this.DEF_PER_OBJ.perNum
    ) {
        if (!isArray(uids)) {
            uids = [ uids ];
        }
        const conditions = this.getConditionsByUids(uids);
        return await GoodsModels.count(conditions).exec();
    }

    /**
     * Get Goods by Category ID(s)
     * @param cids Category ID(s)
     */
    public getByCids(
        cids: ObjectId | ObjectId[], opts = this.DEF_PER_OBJ
    ) {
        if (!isArray(cids)) {
            cids = [ cids ];
        }
        const conditions = this.getConditionsByCids(cids);
        return GoodsModels.find(conditions)
            .skip((opts.page - 1) * opts.perNum).limit(opts.perNum)
            .populate("uploader attributes")
            .sort({ updatedAt: -1 })
            .exec();
    }

    private getConditionsByUids(uids: ObjectId[]) {
        let conditions;
        switch (uids.length) {
            case 0:
                conditions = { };
                break;
            case 1:
                conditions = {
                    uploader: uids[0]
                };
                break;
            default:
                conditions = {
                    $or: uids.reduce((arr, uid) => {
                        arr.push({ uploader: uid });
                        return arr;
                    }, [ ])
                };
                break;
        }
        return conditions;
    }

    /**
     * Get Goods by User ID(s)
     * @param uids User ID(s)
     */
    public getByUids(
        uids: ObjectId | ObjectId[], opts = this.DEF_PER_OBJ
    ) {
        if (!isArray(uids)) {
            uids = [ uids ];
        }
        const conditions = this.getConditionsByUids(uids);
        return GoodsModels.find(conditions)
            .skip((opts.page - 1) * opts.perNum).limit(opts.perNum)
            .select("-uploader")
            .populate("attributes")
            .sort({ updatedAt: -1 })
            .exec();
    }

    /**
     * Get Good by Good ID
     * @param id Good ID
     */
    public async getById(id: ObjectId, opts?: IGetOptions) {
        return (await this.get({ _id: id }, opts))[0];
    }

    /**
     * Edit Good by Good ID
     * @param id Good ID
     */
    public async editById(id: ObjectId, ctx: object) {
        try {
            await GoodsModels
                .update({ _id: id }, ctx, this.DEF_UPDATE_OPTIONS)
                .exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public add(ctx: object) {
        return GoodsModels.create(ctx);
    }

    public async remove(id: ObjectId) {
        const doc = await this.getById(id);
        if (!doc) {
            throw new BadRequestException("Non Exist Good ID");
        }
        const good = doc.toObject();
        try {
            await GoodsModels.findByIdAndRemove(id).exec();
            if (good.attributes.length > 0) {
                const cond = (good.attributes as ObjectId[])
                    .reduce((obj, item) => {
                        obj.$or.push({ _id: item });
                        return obj;
                    }, { $or: [ ] });
                await ValuesModel.remove(cond).exec();
            }
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        await fs.remove(this.getFilepath(good));
    }

    public getFilepath(good: IGoods) {
        const filename = good.filename;
        const cid =
            isObject(good.category) && (good.category as ICategory)._id ?
            (good.category as ICategory)._id :
            good.category;
        if (!cid) {
            throw new BadRequestException();
        }
        return `${config.paths.upload}/${cid}/${filename}`;
    }

}
