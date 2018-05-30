import {
    Base, existsValidator, IDoc, IDocRaw, MODIFY_MOTHODS, ObjectId
} from "@models/common";
import { FLAG as UserFlag, IUser } from "@models/User";
import newCache  = require("@utils/newCache");
import { model, Model as M, SchemaDefinition, SchemaTypes } from "mongoose";

export const FLAG = "tokens";

export const cache = newCache(FLAG);

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

export const Model = model(FLAG, TokensSchema) as M<TokenDoc>;

const getCount = (userId: ObjectId): Promise<number> => {
    return Model.count({ user: userId }).exec();
};
