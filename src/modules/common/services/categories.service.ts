import { Component, BadRequestException } from "@nestjs/common";
import { ObjectId } from "@models/common";
import { Model as CategoriesModel, cache, ICategoryRaw, ICategory } from "@models/Categroy";
import { isFunction, isArray } from "util";
import { BaseService, IGetOptions } from "@services/base";
import { difference } from "lodash";
import { GoodsService } from "@services/goods";

interface IIdMap {
    [parentId: string]: ObjectId[];
}

@Component()
export class CategoriesService extends BaseService {

    constructor(private readonly goodsSvr: GoodsService) {
        super();
        super.setCache(cache);
    }

    private getIdMap() {
        return this.loadAndCache("IdMap", async () => {
            // { parentId: childrenIds }
            const map: IIdMap = { };
            const docs = await CategoriesModel.find().select("_id pid").exec();
            docs.forEach((doc) => {
                const category = doc.toObject();
                let index;
                if (!category.pid) {
                    index = "*";
                } else {
                    index = category.pid.toString();
                }
                if (!map[index]) {
                    map[index] = [ ];
                }
                map[index].push(category._id.toString());
            });
            return map;
        });
    }

    public async getChildrenIds(pid: ObjectId) {
        const map = await this.getIdMap();
        const ids: ObjectId[] = [ ];
        const childrenIds = map[pid.toString()];
        if (childrenIds) {
            ids.push(...childrenIds);
            for (const id of childrenIds) {
                ids.push(...(await this.getChildrenIds(id)));
            }
        }
        return ids;
    }

    private getTags(obj: ICategoryRaw | ICategory) {
        const tags = obj.tags;
        const pid = obj.pid as ICategoryRaw | void;
        if (pid && pid.tags) {
            return tags.concat(this.getTags(pid));
        }
        return tags;
    }

    public async getByTags(tags: string | string[]) {
        if (!isArray(tags)) {
            tags = [ tags ];
        }
        if (tags.length === 0) {
            return Promise.resolve([ ]);
        }
        const conditions = tags.length === 1 ? {
            tags: { $in: tags }
        } : {
            $or: tags.reduce((arr, tag) => {
                arr.push({ tags: { $in: [ tag ] } });
                return arr;
            }, [])
        };
        const p = (await this.get(conditions, {
                populate: [
                    "attributes",
                    { path: "pid", populate: { path: "pid" } }
                ]
            }))
            .map((item) => item.toObject())
            .map((item) => {
                item.tags = Array.from(new Set(this.getTags(item)));
                delete item.pid;
                return item;
            })
            .filter((item) => {
                const diffLength = difference(item.tags, tags).length;
                return diffLength + tags.length === item.tags.length ;
            });
        return p;
    }

    /**
     * Category 列表
     * @param  opts.perNum {number} 每页数量
     * @param  opts.page {number} 页数
     * @return {Promise}
     */
    public async list(opts = this.DEF_PER_OBJ) {
        return CategoriesModel.find({ })
            .skip((opts.page - 1) * opts.perNum).limit(opts.perNum)
            .exec();
    }

    public count() {
        return this.loadAndCache(
            "count", () => CategoriesModel.count({ }).exec()
        );
    }

    public async add(ctx: object) {
        try {
            return await CategoriesModel.create(ctx);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public get(cond: object, opts?: IGetOptions) {
        let p = CategoriesModel.find(cond);
        p = this.documentQueryProcess(p, opts);
        return p.exec();
    }

    public async getById(id: ObjectId, opts?: IGetOptions) {
        const arr = await this.get({ _id: id }, opts);
        return arr.length === 0 ? null : arr[0];
    }

    public async editById(id: ObjectId, ctx: object) {
        try {
            return await CategoriesModel
                .update({ _id: id }, ctx, this.DEF_UPDATE_OPTIONS)
                .exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public async removeById(id: ObjectId) {
        const goods = await this.goodsSvr.getByCids(id);
        if (goods.length > 0) {
            throw new BadRequestException("Some Good in the category");
        }
        const map = await this.getIdMap();
        if (map[id.toString()] && map[id.toString()].length > 0) {
            throw new BadRequestException(
                "The Category have some child categories"
            );
        }
        try {
            return await CategoriesModel.findByIdAndRemove(id).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

}
