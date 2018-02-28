import { Component, BadRequestException } from "@nestjs/common";
import { Model as UsergroupsModel } from "@models/Usergroup";
import { Model as UserUsergroupsModel } from "@models/User-Usergroup";
import { ObjectId } from "@models/common";
import { DEF_PER_COUNT, IPerPage } from "@dtos/page";

@Component()
export class UsergroupsService {

    private DEF_PER_OBJ: IPerPage = {
        perNum: DEF_PER_COUNT,
        page: 1
    };

    public async add(obj: object) {
        try {
            return await UsergroupsModel.create(obj);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public async edit(id: ObjectId, obj: object) {
        try {
            return await UsergroupsModel.update(
                { _id: id }, obj, { runValidators: true, context: "query" }
            ).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public usersCount(gid: ObjectId) {
        return UserUsergroupsModel.count({ usergroup: gid }).exec();
    }

    public async usersCountPage(id: ObjectId, perNum = DEF_PER_COUNT) {
        const total = await this.usersCount(id);
        return Math.ceil(total / perNum);
    }

    public getGroup(gid: ObjectId) {
        return UsergroupsModel.findById(gid).exec();
    }

    public async getGroupUsers(
        gid: ObjectId, pageObj: IPerPage = this.DEF_PER_OBJ
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
        return UsergroupsModel.count({ }).exec();
    }

    public async countPage(perNum = DEF_PER_COUNT) {
        const total = await this.count();
        return Math.ceil(total / perNum);
    }

    public list(pageObj: IPerPage = this.DEF_PER_OBJ) {
        const perNum = pageObj.perNum;
        const page = pageObj.page;
        return UsergroupsModel.find({ })
            .skip((page - 1) * perNum).limit(perNum)
            .sort({ createdAt: -1 })
            .exec();
    }

    public async remove(id: ObjectId) {
        try {
            return await UsergroupsModel.findByIdAndRemove(id).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public async addUserToGroup(id: ObjectId, uid: ObjectId) {
        try {
            await UserUsergroupsModel.create({
                user: uid, usergroup: id
            });
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public async removeUserToGroup(id: ObjectId, uid: ObjectId) {
        try {
            await UserUsergroupsModel.findOneAndRemove({
                user: uid, usergroup: id
            }).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

}
