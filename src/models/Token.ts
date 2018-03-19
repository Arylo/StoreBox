import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import {
    Base, IDoc, IDocRaw, ObjectId, MODIFY_MOTHODS, existsValidator
} from "@models/common";
import { IUser, FLAG as UserFlag } from "@models/User";
import { config } from "@utils/config";
import keyv =  require("keyv");

import { isTest } from "../modules/common/helper/env";

export const cache = new keyv({
    uri: isTest ? undefined : config.redis.url,
    namespace: "Tokens"
});

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
    validator: async (val, respond) => {
        respond(await existsValidator.bind(this)(Model, "token", val, {
            update: false
        }));
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

for (const method of MODIFY_MOTHODS) {
    TokensSchema.post(method, () => {
        cache.clear();
    });
}

export const Model = model(Flag, TokensSchema) as M<TokenDoc>;

const getCount = (userId: ObjectId): Promise<number> => {
    return Model.count({ user: userId }).exec();
};
