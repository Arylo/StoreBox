import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import { Base, IDoc, IDocRaw, ObjectId } from "@models/common";

import { IUser, Flag as UserFlag } from "@models/User";

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
    readonly token: string;
    readonly user: ObjectId | IUser;
}

export interface ITokensRaw extends ITokens {
    user: IUser;
}

const TokensSchema = new Base(Definition).createSchema();

TokensSchema.path("token").validate({
    isAsync: true,
    validator: (val, respond) => {
        Model.findOne({ token: val }).exec().then((result) => {
            respond(result ? false : true);
        });
    },
    message: "The token is existed"
});

export type GoodDoc = IDoc<ITokens>;

export const Model: M<GoodDoc> = model(Flag, TokensSchema);
