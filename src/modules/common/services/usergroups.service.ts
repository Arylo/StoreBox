import { Component, BadRequestException } from "@nestjs/common";
import { Model as UsersModel } from "@models/User";
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

    public async remove(gid: ObjectId) {
        if ((await this.count()) === 1) {
            throw new BadRequestException("Nnn delete unique group");
        }
        try {
            return await UsergroupsModel.findByIdAndRemove(gid).exec();
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
