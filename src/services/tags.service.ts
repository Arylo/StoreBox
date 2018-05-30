import { ObjectId } from "@models/common";
import { ITag, ITagRaw, Model as TagsModel } from "@models/Tag";
import { BadRequestException, Component } from "@nestjs/common";
import { BaseService } from "@services/base";

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
