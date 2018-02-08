import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import { Base, IDoc, IDocRaw, ObjectId, MODIFY_MOTHODS } from "@models/common";
import { IUser, FLAG as UserFlag } from "@models/User";

import Cache =  require("schedule-cache");

const cache = Cache.create(`${Date.now()}${Math.random()}`);

export const Flag = "tokens";

const Definition: SchemaDefinition = {
    token: { type: String, unique: true, index: true },
    user: {
        type: SchemaTypes.ObjectId,
        ref: UserFlag,
        required: true
    }
};

export interface ITokens extends IDocRaw {
    token: string;
    user: ObjectId | IUser;
}

export interface ITokensRaw extends ITokens {
    user: IUser;
}

export type TokenDoc = IDoc<ITokens>;

const TokensSchema = new Base(Definition).createSchema();

// region validators
TokensSchema.path("token").validate({
    isAsync: true,
    validator: (val, respond) => {
        Model.findOne({ token: val }).exec().then((result) => {
            respond(result ? false : true);
        });
    },
    message: "The token is existed"
});

TokensSchema.path("user").validate({
    isAsync: true,
    validator: async (val, respond) => {
        const count = await getCount(val.toString());
        respond(count < 25 ? true : false);
    },
    message: "The user has too much token value"
});
// endregion validators

TokensSchema.static("isVaild", async (username: string, tokenStr: string) => {
    const FLAG = `token[${username}][${tokenStr}]`;
    if (cache.get(FLAG)) {
        return cache.get(FLAG);
    }
    const token = await Model.findOne({ token: tokenStr })
        .populate("user", "username").exec();
    const tokenOwn = token.toObject().user as IUser;
    if (tokenOwn.username === username) {
        cache.put(FLAG, true);
    }
    return cache.get(FLAG);
});

for (const method of MODIFY_MOTHODS) {
    TokensSchema.post(method, () => {
        cache.clear();
    });
}

interface ITokenModel<T extends TokenDoc> extends M<T> {
    isVaild(username: string, tokenStr: string): Promise<boolean>;
}

export const Model = model(Flag, TokensSchema) as ITokenModel<TokenDoc>;

const getCount = async (userId: ObjectId): Promise<number> => {
    if (cache.get(userId.toString())) {
        cache.get(userId.toString());
    }
    const count = await Model.count({ user: userId }).exec();
    cache.put(userId.toString(), count);
    return cache.get(userId.toString());
};
