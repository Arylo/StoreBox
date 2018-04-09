import { Component, Param, BadRequestException } from "@nestjs/common";
import { UidDto } from "@dtos/ids";
import {
    Model as CollectionsModel, cache, ICollections, ICollectionsRaw
} from "@models/Collection";
import { ObjectId } from "@models/common";
import { DEF_PER_COUNT } from "@dtos/page";
import { IEditCollection } from "@dtos/collections";
import { BaseService, IGetOptions } from "@services/base";

@Component()
export class CollectionsService extends BaseService<ICollections> {

    constructor() {
        super();
        this.setCache(cache);
        this.setModel(CollectionsModel);
    }

    public create(obj: object) {
        return super.create(obj);
    }

    public edit(cid: ObjectId, ctx: IEditCollection) {
        return this.modifyById(cid, ctx);
    }

    public list(uid: ObjectId, pageObj = this.DEF_PER_OBJ) {
        const perNum = pageObj.perNum || this.DEF_PER_OBJ.perNum;
        const page = pageObj.page || this.DEF_PER_OBJ.page;
        return this.loadAndCache(
            `list_${uid.toString()}_${perNum}_${page}`,
            () => this.findObjects({ creator: uid }, {
                sort: { updatedAt: -1 },
                page, perNum,
                populate: [ "creator", "goods" ]
            }),
            1000
        );
    }

    public count(uid: ObjectId) {
        return this.total({ creator: uid });
    }

    private readonly GET_OPTIONS: IGetOptions = {
        populate: [ "creator", "goods" ]
    };

    /**
     * Get By Collection Name
     * @param name Collection Name
     */
    public getObjectByName(name: string, opts = this.GET_OPTIONS) {
        return this.loadAndCache(
            `getByName_${name}`,
            () => this.findObject({ name }, opts) as Promise<ICollectionsRaw>,
            1000
        );
    }

    /**
     * Get By Collection ID
     * @param id Collection ID
     */
    public getObjectById(id: ObjectId, opts = this.GET_OPTIONS) {
        return this.loadAndCache(
            `getById_${id.toString()}`,
            () => this.findObjectById(id, opts) as Promise<ICollectionsRaw>,
            1000
        );
    }

    public remove(cid: ObjectId) {
        return this.deleteById(cid);
    }

}
