import { Component, BadRequestException } from "@nestjs/common";
import { Model as GoodsModels } from "@models/Good";
import { ObjectId } from "@models/common";
import { BaseService, IGetOptions } from "@services/base";
import { isArray } from "util";

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
        let p = GoodsModels.findOne(cond);
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
                .exec()
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
    public getById(id: ObjectId, opts?: IGetOptions) {
        let p = GoodsModels.findById(id);
        p = this.documentQueryProcess(p, opts);
        return p.exec();
    }

    /**
     * Edit Good by Good ID
     * @param id Good ID
     */
    public async editById(id: ObjectId, ctx: object) {
        try {
            await GoodsModels.findByIdAndUpdate(id, ctx).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public add(ctx: object) {
        return GoodsModels.create(ctx);
    }

}
