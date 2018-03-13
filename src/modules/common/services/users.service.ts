import { Component, BadRequestException } from "@nestjs/common";
import { ObjectId } from "@models/common";
import { Model as UsersModel, UserDoc } from "@models/User";
import { Model as UserUsergroupsModel } from "@models/User-Usergroup";
import { IUsergroups } from "@models/Usergroup";
import { SystemService } from "@services/system";
import { BaseService, IGetOptions } from "@services/base";

@Component()
export class UsersService extends BaseService {

    constructor(private readonly sysSvr: SystemService) {
        super();
    }

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

    public async isVaild(username: string, password: string) {
        try {
            return await UsersModel.isVaild(username, password);
        } catch (err) {
            throw new BadRequestException(err.toString());
        }
    }

    public countUsergroups(uid: ObjectId) {
        return UserUsergroupsModel.count({ user: uid }).exec();
    }

    public async getUsergroups(
        uid: ObjectId, pageObj = this.DEF_PER_OBJ
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
     * 修改`User`属性, 除了`username`和`password`
     * @param id User ID
     * @param content Content
     */
    public async modify(id: ObjectId, content): Promise<UserDoc> {
        for (const field of [ "username", "password" ]) {
            if (content && content[field]) {
                delete content[field];
            }
        }
        if (Object.keys(content).length === 0) {
            throw new BadRequestException("Empty Content");
        }
        try {
            return await UsersModel
                .update({ _id: id }, content, this.DEF_UPDATE_OPTIONS)
                .exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public async passwd(id: ObjectId, oldPass: string, newPass: string) {
        try {
            return await UsersModel.passwd(id, oldPass, newPass);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    /**
     * 返回总数
     */
    public conut() {
        return UsersModel.count({ }).exec();
    }

    /**
     * 获取用户列表
     *
     * @param opts.perNum 每页数量
     * @param opts.page {number} 页数
     */
    public list(opts = this.DEF_PER_OBJ) {
        return UsersModel.find().select("-password")
            .skip((opts.page - 1) * opts.perNum).limit(opts.perNum)
            .exec();
    }

    /**
     * Get User By User ID
     * @param id User ID
     */
    public getById(id: ObjectId, opts?: IGetOptions) {
        let p = UsersModel.findById(id);
        p = this.documentQueryProcess(p, opts);
        return p.exec();
    }
}
