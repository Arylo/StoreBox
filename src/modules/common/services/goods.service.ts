import { Component } from "@nestjs/common";
import { Model as GoodsModels } from "@models/Good";
import { ObjectId } from "@models/common";
import { BaseService } from "@services/base";

@Component()
export class GoodsService extends BaseService {

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

}
