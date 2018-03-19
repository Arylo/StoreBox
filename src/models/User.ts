import { model, SchemaDefinition, Model as M } from "mongoose";
import * as md5 from "md5";
import { config } from "@utils/config";
import { ObjectId, existsValidator } from "@models/common";
import { DEF_PER_COUNT } from "@dtos/page";
import { Base, IDoc, IDocRaw, MODIFY_MOTHODS } from "./common";
import keyv =  require("keyv");

import { isTest } from "../modules/common/helper/env";

export const cache = new keyv({
    uri: isTest ? undefined : config.redis.url,
    namespace: "Users"
});

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

// region validators

UsersSchema.path("username").validate({
    isAsync: true,
    validator: async function usernameModifyValidator(val, respond) {
        if (this && !this.isNew) {
            const id = this.getQuery()._id;
            const col = await Model.findById(id).exec();
            return respond(col.toObject().username === val);
        }
        return respond(true);
    },
    message: "The username cannt modify"
});

UsersSchema.path("username").validate({
    isAsync: true,
    validator: async function usernameExistValidator(val, respond) {
        if (this && !this.isNew) {
            return respond(true);
        }
        respond(await existsValidator.bind(this)(
            Model, "username", val, { update: false }
        ));
    },
    message: "The username is existed"
});

// endregion validators

const encryptStr = (pwd: string) => {
    return md5(md5(pwd) + config.db.salt);
};

// region static methods

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
     * 修改用户密码
     *
     * @param  id {ObjectID} 用户名ID
     * @param  OldPassword {string} 旧密码
     * @param  NewPassword {string} 新密码
     * @return {Promise}
     */
    passwd(id: ObjectId, oldPass: string, newPass: string): Promise<T>;
    /**
     * 验证用户是否存在
     *
     * @param  username {string} 用户名
     * @param  password {string} 密码
     * @return {Promise}
     */
    isVaild(username: string, password: string): Promise<T>;
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
