import { Component, BadRequestException } from "@nestjs/common";
import { ObjectId } from "@models/common";
import {
    Model as CategoriesModel, cache, ICategoryRaw, ICategory
} from "@models/Categroy";
import { isFunction, isArray } from "util";
import { BaseService, IGetOptions } from "@services/base";
import * as lodash from "lodash";
import { GoodsService } from "@services/goods";

interface IIdMap {
    [parentId: string]: ObjectId[];
}

interface ITagMap {
    [tag: string]: ObjectId[];
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

    private getTagMap() {
        const allTagMap = async () => {
            const map: ITagMap = { };
            const categories =
                await this.findObjects({ }, { select: "_id tags" });
            for (const category of categories) {
                const pids = await this.getChildrenIds(category._id);
                for (const tag of category.tags || [ ]) {
                    if (!map[tag]) {
                        map[tag] = [ ];
                    }
                    map[tag].push(category._id.toString(), ...pids);
                }
            }
            return map;
        };
        return this.loadAndCache("TagMap", allTagMap);
    }

    public getChildrenIds(pid: ObjectId) {
        return this.loadAndCache(`ChildrenIds_${pid.toString()}`, async () => {
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
        });
    }

    /* istanbul ignore next */
    public getParentIds(id: ObjectId) {
        return this.loadAndCache(`ParentIds_${id.toString()}`, async () => {
            const category = await this.findObjectById(id);
            const ids: ObjectId[] = [ ];
            if (category && category.pid) {
                const pid = category.pid.toString();
                ids.push(pid, ...await this.getParentIds(pid));
            }
            return ids;
        });
    }

    public async getTags() {
        const map = await this.getTagMap();
        return Object.keys(map).sort();
    }

    public async getObjectsByTags(tags: string[], opts = { recursive: true }) {
        let ids: ObjectId[] = [ ];
        const tagMap = await this.getTagMap();
        tags.forEach((tag) => {
            if (tagMap[tag]) {
                ids.push(...tagMap[tag]);
            }
        });
        if (ids.length === 0) {
            return [ ];
        }
        const counts = lodash.countBy(ids);
        ids = Object.keys(counts).reduce((arr, id) => {
            if (counts[id] >= tags.length) {
                arr.push(id);
            }
            return arr;
        }, [ ]);
        if (opts.recursive) {
            for (const id of Array.from(new Set(ids))) {
                ids.push(...await this.getChildrenIds(id));
            }
        }
        ids = Array.from(new Set(ids));
        const cond = {
            $or: ids.map((id) => {
                return { _id: id };
            })
        };
        const categories = await this.findObjects(cond);
        return categories.map((category) => {
            category.tags.push(...tags);
            category.tags = Array.from(new Set(category.tags));
            delete category.pid;
            return category;
        });
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

    public async editById(id: ObjectId, ctx: any) {
        if (ctx && ctx.pid) {
            const parentCategory  = await this.getById(ctx.pid);
            if (!parentCategory) {
                throw new BadRequestException(
                    "The Parent Category isnt exist!"
                );
            }
            const pid = ctx.pid.toString();
            if (!!~(await this.getChildrenIds(id)).indexOf(pid)) {
                throw new BadRequestException(
                    "It would bad loop, if set the Parent Category"
                );
            }
        }
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
