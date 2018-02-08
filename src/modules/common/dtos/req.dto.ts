import { ObjectId } from "@models/common";

export interface IReqUser {
    readonly account: string;
    readonly roles: string[];
    readonly token?: ObjectId;
}
