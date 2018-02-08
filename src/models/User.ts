import { model, SchemaDefinition, Model as M } from "mongoose";
import * as md5 from "md5";
import { config } from "@utils/config";
import { ObjectId } from "@models/common";
import { DEF_PER_COUNT } from "@dtos/page";
import Cache =  require("schedule-cache");
import { Base, IDoc, IDocRaw, MODIFY_MOTHODS } from "./common";

const cache = Cache.create(`${Date.now()}${Math.random()}`);

export const FLAG = "users";

const Definition: SchemaDefinition = {
    username: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    nickname: { type: String },
    active: { type: Boolean, default: true }
};

export interface IUser extends IDocRaw {
    username: string;
    password: string;
    nickname: string;
    active: boolean;
}
export type UserDoc = IDoc<IUser>;

const UsersSchema = new Base(Definition).createSchema();

const encryptStr = (pwd: string) => {
    return md5(md5(pwd) + config.db.salt);
};

// region static methods
UsersSchema.static("countUsers", async (perNum = 1) => {
    const FLAG = `page_count_${perNum}`;
    if (cache.get(FLAG)) {
        return cache.get(FLAG);
    }
    cache.put(FLAG, Math.ceil((await Model.count({ }).exec()) / perNum));
    return cache.get(FLAG);
});

UsersSchema.static("addUser", (username: string, password: string) => {
    const newObj = {
        username: username,
        password: encryptStr(password),
        nickname: username
    };
    return Model.create(newObj);
});

UsersSchema.static("removeUser", (id: ObjectId) => {
    return Model.count({ }).exec().then((num) => {
        if (num === 1) {
            return Promise.reject("Must Have One User");
        }
        return Model.findByIdAndRemove(id).select("-password").exec();
    });
});

UsersSchema.static("list", (perNum = DEF_PER_COUNT, page = 1) => {
    return Model.find().select("-password")
        .skip((page - 1) * perNum).limit(perNum)
        .exec();
});

UsersSchema.static("passwd", (id: ObjectId, oldP: string, newP: string) => {
    return Model.findById(id).exec()
        .then((result) => {
            if (!result) {
                return Promise.reject("The id isnt exist");
            }
            const user = result.toObject();
            if (user.password !== encryptStr(oldP)) {
                return Promise.reject("Old Password Disvaild");
            }
            if (user.password === encryptStr(newP)) {
                return Promise.reject("The new password is the same as the old one");
            }
            return Model.findByIdAndUpdate(id, {
                password: encryptStr(newP)
            }).select("-password").exec();
        });
});

UsersSchema.static("ban", (id: ObjectId) => {
    return Model.count({ active: true }).exec()
        .then((num) => {
            if (num === 1) {
                return Promise.reject("Must have one active user");
            }
            return Model.findByIdAndUpdate(id, { active: false })
                .select("-password")
                .exec();
        });
});

UsersSchema.static("allow", (id: ObjectId) => {
    return Model.findByIdAndUpdate(id, { active: true })
        .select("-password")
        .exec();
});

UsersSchema.static("isVaild", (username: string, password: string) => {
    return Model.findOne({ username: username }).exec()
        .then((result) => {
            if (!result) {
                return Promise.reject("User isnt exist");
            }
            const user = result.toObject();
            if (!user.active) {
                return Promise.reject("User is baned");
            }
            return Model.findOne({
                username: username,
                password: encryptStr(password)
            }).select("-password").exec().then((result) => {
                if (!result) {
                    return Promise.reject("Password Disvaild");
                }
                return Promise.resolve(result);
            });
        });
});
// endregion static methods

interface IUserModel<T extends UserDoc> extends M<T> {
    /**
     * 创建新用户
     *
     * @param  username {string} 用户名
     * @param  password {string} 密码
     * @return {Promise}
     */
    addUser(username: string, password: string): Promise<T>;
    /**
     * 删除用户
     *
     * @param  id {ObjectID} 用户名ID
     * @return {Promise}
     */
    removeUser(id: ObjectId): Promise<T>;
    /**
     * 获取用户列表
     *
     * @param  perNum {number} 每页数量
     * @param  page {number} 页数
     * @return {Promise}
     */
    list(perNum?: number, page?: number): Promise<T[]>;
    /**
     * 修改用户密码
     *
     * @param  id {ObjectID} 用户名ID
     * @param  OldPassword {string} 旧密码
     * @param  NewPassword {string} 新密码
     * @return {Promise}
     */
    passwd(id: ObjectId, oldPass: string, newPass: string): Promise<T>;
    /**
     * 禁用某个用户
     *
     * @param  id {ObjectID} 用户名ID
     * @return {Promise}
     */
    ban(id: ObjectId): Promise<T>;
    /**
     * 取消禁用某个用户
     *
     * @param  id {ObjectID} 用户名ID
     * @return {Promise}
     */
    allow(id: ObjectId): Promise<T>;
    /**
     * 验证用户是否存在
     *
     * @param  username {string} 用户名
     * @param  password {string} 密码
     * @return {Promise}
     */
    isVaild(username: string, password: string): Promise<T>;
    /**
     * 返回总页数
     */
    countUsers(perNum?: number): Promise<number>;
}

// region Validators
UsersSchema.path("username").validate({
    isAsync: true,
    validator: (val, respond) => {
        Model.findOne({ username: val }).exec().then((result) => {
            respond(result ? false : true);
        });
    },
    message: "The username is existed"
});
// endregion Validators

for (const method of MODIFY_MOTHODS) {
    UsersSchema.post(method, () => {
        cache.clear();
    });
}

export const Model = model(FLAG, UsersSchema) as IUserModel<UserDoc>;
