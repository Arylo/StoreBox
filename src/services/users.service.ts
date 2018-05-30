import { ObjectId } from "@models/common";
import { cache, IUser, Model as UsersModel, UserDoc } from "@models/User";
import { Model as UserUsergroupsModel } from "@models/User-Usergroup";
import { IUsergroups } from "@models/Usergroup";
import { BadRequestException, Component } from "@nestjs/common";
import { BaseService, IGetOptions } from "@services/base";
import { SystemService } from "@services/system";
import { config } from "@utils/config";
import sleep = require("@utils/sleep");

@Component()
export class UsersService extends BaseService<IUser> {

    constructor(private readonly sysSvr: SystemService) {
        super();
        this.setCache(cache);
        this.setModel(UsersModel);
    }

    protected async beforeEach() {
        const num = await cache.get("total") ||
            await UsersModel.count({ }).exec();
        if (num !== 0) {
            return;
        }
        const user = await UsersModel.addUser(
            config.defaults.user.name, config.defaults.user.pass
        );
        const gid = await this.sysSvr.getDefaultUsergroup();
        if (gid) {
            await UserUsergroupsModel.create({
                user: user._id, usergroup: gid
            });
        }
    }

    public async addUser(obj, gid?: ObjectId) {
        await this.runBeforeAll();
        await this.runBeforeEach();
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
        await this.deleteById(uid);
        try {
            await UserUsergroupsModel.remove({ user: uid }).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public async isVaild(username: string, password: string) {
        await this.runBeforeAll();
        await this.runBeforeEach();
        await sleep(200);
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
        await this.runBeforeAll();
        await this.runBeforeEach();
        const perNum = pageObj.perNum || this.DEF_PER_OBJ.perNum;
        const page = pageObj.page || this.DEF_PER_OBJ.page;
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
        return this.modifyById(id, content);
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
        return this.total({ });
    }

    /**
     * 获取用户列表
     *
     * @param opts.perNum 每页数量
     * @param opts.page {number} 页数
     */
    public list(opts = this.DEF_PER_OBJ) {
        const perNum = opts.perNum || this.DEF_PER_OBJ.perNum;
        const page = opts.page || this.DEF_PER_OBJ.page;
        const Flag = `list_${perNum}_${page}`;
        return this.loadAndCache(
            Flag,
            () => this.findObjects({ }, {
                select: "-password",
                perNum, page
            })
        );
    }

    /**
     * Get User By User ID
     * @param id User ID
     */
    public getById(id: ObjectId, opts?: IGetOptions) {
        return this.findById(id, opts);
    }
}
