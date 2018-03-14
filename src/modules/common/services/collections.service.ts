import { Component, Param, BadRequestException } from "@nestjs/common";
import { UidDto } from "@dtos/ids";
import { Model as CollectionsModel, cache } from "@models/Collection";
import { ObjectId } from "@models/common";
import { DEF_PER_COUNT } from "@dtos/page";
import { IEditCollection } from "../../../modules/collections/collections.dto";
import { BaseService, IGetOptions } from "@services/base";

@Component()
export class CollectionsService extends BaseService {

    constructor() {
        super();
        this.setCache(cache);
    }

    public async create(obj) {
        try {
            return await CollectionsModel.create(obj);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public async edit(cid: ObjectId, ctx: IEditCollection) {
        try {
            return await CollectionsModel
                .update({ _id: cid }, ctx, this.DEF_UPDATE_OPTIONS)
                .exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public list(uid: ObjectId, pageObj = this.DEF_PER_OBJ) {
        const perNum = pageObj.perNum;
        const page = pageObj.page;
        return this.loadAndCache(
            `list_${uid.toString}_${perNum}_${page}`,
            () => {
                return CollectionsModel.find({ creator: uid })
                    .skip((page - 1) * perNum).limit(perNum)
                    .sort({ updatedAt: -1 })
                    .populate("creator")
                    .populate("goods")
                    .exec();
            },
            7200
        );
    }

    public count(uid: ObjectId) {
        return this.loadAndCache(
            `count_${uid}`,
            () => CollectionsModel.count({ creator: uid }).exec()
        );
    }

    private readonly GET_OPTIONS: IGetOptions = {
        populate: [ "creator", "goods" ]
    };

    /**
     * Get By Collection Name
     * @param name Collection Name
     */
    public getByName(name: string, opts = this.GET_OPTIONS) {
        let p = CollectionsModel.findOne({ name });
        p = this.documentQueryProcess(p, opts);
        return this.loadAndCache(
            `getByName_${name}`,
            () => p.exec(),
            7200
        );
    }

    /**
     * Get By Collection ID
     * @param id Collection ID
     */
    public getById(id: ObjectId, opts = this.GET_OPTIONS) {
        let p = CollectionsModel.findById(id);
        p = this.documentQueryProcess(p, opts);
        return this.loadAndCache(
            `getById_${id.toString()}`,
            () => p.exec(),
            7200
        );
    }

    public async remove(cid: ObjectId) {
        try {
            return await CollectionsModel.findByIdAndRemove(cid).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

}
