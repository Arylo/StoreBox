import { Component, BadRequestException } from "@nestjs/common";
import { ObjectId } from "@models/common";
import { Model as UsersModel, UserDoc } from "@models/User";
import { Model as UserUsergroupsModel } from "@models/User-Usergroup";
import { IUsergroups } from "@models/Usergroup";
import { SystemService } from "@services/system";
import { IPerPage, DEF_PER_COUNT } from "@dtos/page";

@Component()
export class UsersService {

    private DEF_PER_OBJ: IPerPage = {
        perNum: DEF_PER_COUNT,
        page: 1
    };

    constructor(private readonly sysSvr: SystemService) { }

    public async addUser(obj, gid?: ObjectId) {
        try {
            const user = await UsersModel.addUser(obj.username, obj.password);
            if (!gid) {
                gid = await this.sysSvr.getDefaultUsergroup();
            }
            await UserUsergroupsModel.create({
                user: user._id, usergroup: gid
            });
            return user;
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public async removeUser(uid: ObjectId) {
        try {
            await UsersModel.removeUser(uid);
            await UserUsergroupsModel.remove({ user: uid }).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public countUsergroups(uid: ObjectId) {
        return UserUsergroupsModel.count({ user: uid }).exec();
    }

    public async countPageUsergroups(uid: ObjectId, perNum = DEF_PER_COUNT) {
        const total = await this.countUsergroups(uid);
        return Math.ceil(total / perNum);
    }

    public async getUsergroups(
        uid: ObjectId, pageObj: IPerPage = this.DEF_PER_OBJ
    ) {
        const perNum = pageObj.perNum;
        const page = pageObj.page;
        const groups = await UserUsergroupsModel
            .find({ user: uid }).populate("usergroup")
            .skip((page - 1) * perNum).limit(perNum)
            .exec();
        return groups.map((item) => {
            return item.toObject().usergroup as IUsergroups;
        });
    }

    /**
     * 修改`User`属性, 除了`username`
     * @param id User ID
     * @param content Content
     */
    public async modify(id: ObjectId, content): Promise<UserDoc> {
        if (content && content.username) {
            delete content.username;
        }
        if (Object.keys(content).length === 0) {
            throw new BadRequestException("Empty Content");
        }
        try {
            return await UsersModel.update({ _id: id }, content, {
                runValidators: true, context: "query"
            }).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }
}
