import { Component, BadRequestException } from "@nestjs/common";
import { ObjectId } from "@models/common";
import { Model as SystemModel } from "@models/System";
import { Model as UsergroupsModel } from "@models/Usergroup";

import { systemLogger } from "../helper/log";

@Component()
export class SystemService {

    public static DEFAULT_USERGROUP_FLAG = "DEFAULT_USERGROUP";

    /**
     * Get Default Usergroup ID
     * @returns Usergroup ID
     */
    public async getDefaultUsergroup(): Promise<ObjectId> {
        let gid: any = await SystemModel.findOne({
            key: SystemService.DEFAULT_USERGROUP_FLAG
        }).exec();
        /* istanbul ignore if */
        if (!gid) {
            systemLogger.warn(`Miss ${SystemService.DEFAULT_USERGROUP_FLAG}`);
            gid = (await UsergroupsModel.findOne().exec())._id;
            this.setDefaultUsergroup(gid);
        }
        return gid;
    }

    /**
     * Set Default Usergroup ID
     * @param gid Usergroup ID
     */
    public async setDefaultUsergroup(gid: ObjectId) {
        const doc = await UsergroupsModel.findById(gid).exec();
        /* istanbul ignore if */
        if (!doc) {
            throw new BadRequestException("The ID isnt a Usergroup ID");
        }
        return SystemModel
            .findOneAndUpdate(
                { key: SystemService.DEFAULT_USERGROUP_FLAG }, { value: gid },
                { upsert: true }
            )
            .exec();
    }

}
