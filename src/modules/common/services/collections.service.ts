import { Component, Param, BadRequestException } from "@nestjs/common";
import { UidDto } from "@dtos/ids";
import { Model as CollectionsModel } from "@models/Collection";
import { ObjectId } from "@models/common";
import { IPerPage, DEF_PER_COUNT } from "@dtos/page";
import { IEditCollection } from "../../../modules/collections/collections.dto";

@Component()
export class CollectionsService {

    private DEF_PER_OBJ: IPerPage = {
        perNum: DEF_PER_COUNT,
        page: 1
    };

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

    public list(uid: ObjectId, pageObj: IPerPage = this.DEF_PER_OBJ) {
        const perNum = pageObj.perNum;
        const page = pageObj.page;
        return CollectionsModel.find({ creator: uid })
            .skip((page - 1) * perNum).limit(perNum)
            .sort({ updatedAt: -1 })
            .populate("creator")
            .populate("goods")
            .exec();
    }

    public count(uid: ObjectId) {
        return CollectionsModel.count({ creator: uid }).exec();
    }

    public async countPage(uid: ObjectId, perNum = DEF_PER_COUNT) {
        const total = await this.count(uid);
        return Math.ceil(total / perNum);
    }

    public getByName(name: string) {
        return CollectionsModel.findOne({ name })
            .populate("creator")
            .populate("goods")
            .exec();
    }

    public getById(cid: ObjectId) {
        return CollectionsModel.findById(cid)
            .populate("creator")
            .populate("goods")
            .exec();
    }

    public async remove(cid: ObjectId) {
        try {
            return await CollectionsModel.findByIdAndRemove(cid).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

}
