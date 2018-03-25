import { Component, BadRequestException } from "@nestjs/common";
import { Model as UsersModel } from "@models/User";
import {
    Model as UsergroupsModel, IUsergroups, cache
} from "@models/Usergroup";
import { Model as UserUsergroupsModel } from "@models/User-Usergroup";
import { ObjectId } from "@models/common";
import { BaseService } from "@services/base";

@Component()
export class UsergroupsService extends BaseService<IUsergroups> {

    constructor() {
        super();
        this.setCache(cache);
        this.setModel(UsergroupsModel);
    }

    public add(obj: object) {
        return this.create(obj);
    }

    public async edit(id: ObjectId, obj: object) {
        try {
            return await UsergroupsModel
                .update({ _id: id }, obj, this.DEF_UPDATE_OPTIONS)
                .exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public usersCount(gid: ObjectId) {
        return UserUsergroupsModel.count({ usergroup: gid }).exec();
    }

    public getGroup(gid: ObjectId) {
        return this.findById(gid);
    }

    public async getGroupUsers(
        gid: ObjectId, pageObj = this.DEF_PER_OBJ
    ) {
        const perNum = pageObj.perNum;
        const page = pageObj.page;
        return (await UserUsergroupsModel.find({ usergroup: gid })
            .skip((page - 1) * perNum).limit(perNum)
            .populate("user").exec()
        ).map((item) => {
            return item.toObject().user;
        });
    }

    public count() {
        return this.total({ });
    }

    public list(pageObj = this.DEF_PER_OBJ) {
        const perNum = pageObj.perNum || this.DEF_PER_OBJ.perNum;
        const page = pageObj.page || this.DEF_PER_OBJ.page;
        return this.loadAndCache(
            `list_${perNum}_${page}`,
            () => this.findObjects({ }, {
                perNum, page, sort: { createdAt: -1 }
            })
        );
    }

    /**
     * Remove Usergroup By Usergroup ID
     * @param gid Usergroup ID
     */
    public async remove(gid: ObjectId) {
        if ((await this.count()) === 1) {
            throw new BadRequestException("Cant delete unique group");
        }
        const p = await this.deleteById(gid);
        try {
            await UserUsergroupsModel.findOneAndRemove({
                usergroup: gid
            }).exec();
            return p;
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public async addUserToGroup(gid: ObjectId, uid: ObjectId) {
        if (!(await UsersModel.findById(uid).exec())) {
            throw new BadRequestException("The User ID is not exist");
        }
        if (!(await UsergroupsModel.findById(gid).exec())) {
            throw new BadRequestException("The Usergroup ID is not exist");
        }
        if (await UserUsergroupsModel.findOne({
            user: uid, usergroup: gid
        }).exec()) {
            throw new BadRequestException("User has been in the usergroup");
        }
        try {
            return await UserUsergroupsModel.create({
                user: uid, usergroup: gid
            });
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public async removeUserFromGroup(gid: ObjectId, uid: ObjectId) {
        try {
            await UserUsergroupsModel.findOneAndRemove({
                user: uid, usergroup: gid
            }).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

}
