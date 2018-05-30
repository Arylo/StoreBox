import { ICategory } from "@models/Categroy";
import { ObjectId } from "@models/common";
import { IGoods, IGoodsRaw, Model as GoodsModels } from "@models/Good";
import { Model as ValuesModel } from "@models/Value";
import { BadRequestException, Component } from "@nestjs/common";
import { BaseService, IGetOptions } from "@services/base";
import { config } from "@utils/config";
import fs = require("fs-extra");
import { isArray, isObject, isString } from "util";

@Component()
export class GoodsService extends BaseService<IGoods> {

    constructor() {
        super();
        this.setModel(GoodsModels);
    }

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
        return this.find(cond, opts);
    }

    public listByCategoryId(cid: ObjectId, opts = this.DEF_PER_OBJ) {
        return this.loadAndCache(
            `list_category_${cid.toString()}`,
            () => this.findObjects({ category: cid }, Object.assign({
                populate: [ "uploader", "attributes" ],
                select: "-category"
            }, Object.assign({ }, this.DEF_PER_OBJ, opts))),
            1000
        );
    }

    public countByCids(cids: ObjectId | ObjectId[]) {
        if (!isArray(cids)) {
            cids = [ cids ];
        }
        if (cids.length === 0) {
            return Promise.resolve(0);
        }
        const conditions = this.getConditionsByCids(cids);
        return this.total(conditions);
    }

    public countByUids(uids: ObjectId | ObjectId[]) {
        if (!isArray(uids)) {
            uids = [ uids ];
        }
        const conditions = this.getConditionsByUids(uids);
        return this.total(conditions);
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
        return this.find(conditions, Object.assign({
            populate: "uploader attributes",
            sort: { updatedAt: -1 }
        }, Object.assign({ }, this.DEF_PER_OBJ, opts)));
    }

    private getConditionsByUids(uids: ObjectId[]) {
        switch (uids.length) {
            case 0:
                return { };
            case 1:
                return {
                    uploader: uids[0]
                };
            default:
                return {
                    $or: uids.reduce((arr, uid) => {
                        arr.push({ uploader: uid });
                        return arr;
                    }, [ ])
                };
        }
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
        return this.find(conditions, Object.assign({
            select: "-uploader",
            populate: "attributes",
            sort: { updatedAt: -1 }
        }, Object.assign({ }, this.DEF_PER_OBJ, opts)));
    }

    /**
     * Get Good by Good ID
     * @param id Good ID
     */
    public getById(id: ObjectId, opts?: IGetOptions) {
        return super.findById(id, opts);
    }

    /**
     * Get Good by Good ID
     * @param id Good ID
     */
    public getObjectById(id: ObjectId, opts?: IGetOptions) {
        return super.findObjectById(id, opts);
    }

    /**
     * Edit Good by Good ID
     * @param id Good ID
     */
    public editById(id: ObjectId, ctx: object) {
        return this.modifyById(id, ctx);
    }

    public add(ctx: object) {
        return this.create(ctx);
    }

    public async remove(id: ObjectId) {
        const good = await this.findObjectById(id);
        if (!good) {
            throw new BadRequestException("Non Exist Good ID");
        }
        this.deleteById(id);
        try {
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
