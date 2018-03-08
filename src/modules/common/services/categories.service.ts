import { Component } from "@nestjs/common";
import { ObjectId } from "@models/common";
import { Model as CategoriesModel, cache } from "@models/Categroy";
import { isFunction } from "util";

interface IIdMap {
    [parentId: string]: ObjectId[];
}

@Component()
export class CategoriesService {

    private loadAndCache(FLAG: string, value: () => any, time?: number) {
        const c = cache.get(FLAG);
        if (c) {
            return c;
        }
        const val = value();
        cache.put(FLAG, val, time);
        return val;
    }

    private async getIdMap() {
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
    }

    public async getChildrenIds(pid: ObjectId) {
        const map: IIdMap = await this.loadAndCache("IdMap", () => {
            return this.getIdMap();
        });
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

}
