import { BaseService } from "@services/base";
import { Component, BadRequestException } from "@nestjs/common";
import { ObjectId } from "@models/common";
import { Model as TagsModel, ITagRaw, ITag } from "@models/Tag";

@Component()
export class TagsService extends BaseService<ITag> {

    constructor() {
        super();
        this.setModel(TagsModel);
    }

    public list(cond?: object, opts = this.DEF_PER_OBJ) {
        const options = Object.assign({ }, this.DEF_PER_OBJ, opts);
        return this.findObjects(cond, options);
    }

}
