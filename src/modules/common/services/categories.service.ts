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
export class CategoriesService extends BaseService<ICategory> {

    constructor(private readonly goodsSvr: GoodsService) {
        super();
        super.setCache(cache);
        super.setModel(CategoriesModel);
    }

    private getIdMap() {
        return this.loadAndCache("IdMap", async () => {
            // { parentId: childrenIds }
            const map: IIdMap = { };
            const categories =
                await this.findObjects({ }, { select: "_id pid" });
            categories.forEach((category) => {
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
        const p = (await this.findObjects(conditions, {
                populate: [
                    "attributes",
                    { path: "pid", populate: { path: "pid" } }
                ]
            }))
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
        return this.find({ }, opts);
    }

    public count() {
        return this.total({ });
    }

    public add(ctx: object) {
        return this.create(ctx);
    }

    public get(cond: object, opts?: IGetOptions) {
        return this.find(cond, opts);
    }

    public async getById(id: ObjectId, opts?: IGetOptions) {
        return this.findById(id, opts);
    }

    public editById(id: ObjectId, ctx: object) {
        return this.modifyById(id, ctx);
    }

    public async removeById(id: ObjectId) {
        const goods = await this.goodsSvr.getByCids(id);
        if (goods.length > 0) {
            throw new BadRequestException("Some Good in the category");
        }
        if ((await this.getChildrenIds(id)).length > 0) {
            throw new BadRequestException(
                "The Category have some child categories"
            );
        }
        return this.deleteById(id);
    }

}
