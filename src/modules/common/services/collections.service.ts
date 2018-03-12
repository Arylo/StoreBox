import { Component, Param, BadRequestException } from "@nestjs/common";
import { UidDto } from "@dtos/ids";
import { Model as CollectionsModel, cache } from "@models/Collection";
import { ObjectId } from "@models/common";
import { DEF_PER_COUNT } from "@dtos/page";
import { IEditCollection } from "../../../modules/collections/collections.dto";
import { BaseService } from "@services/base";

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
            return await CollectionsModel.update({ _id: cid }, ctx, {
                runValidators: true, context: "query"
            }).exec();
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

    public getByName(name: string, opts = this.GetOptions) {
        let p = CollectionsModel.findOne({ name });
        if (opts.populate && opts.populate.length > 0) {
            for (const field of opts.populate) {
                p = p.populate(field);
            }
        }
        return this.loadAndCache(
            `getByName_${name}`,
            () => p.exec(),
            7200
        );
    }

    private readonly GetOptions = {
        populate: [ "creator", "goods" ]
    };

    public getByCid(cid: ObjectId, opts = this.GetOptions) {
        let p = CollectionsModel.findById(cid);
        if (opts.populate && opts.populate.length > 0) {
            for (const field of opts.populate) {
                p = p.populate(field);
            }
        }
        return this.loadAndCache(
            `getById_${cid.toString()}`,
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
