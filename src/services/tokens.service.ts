import { BaseService } from "@services/base";
import { Component, BadRequestException } from "@nestjs/common";
import { ObjectId } from "@models/common";
import { Model as TokensModel, cache } from "@models/Token";
import { IUser } from "@models/User";
import { IUidDto } from "@dtos/ids";

@Component()
export class TokensService extends BaseService {

    constructor() {
        super();
        this.setCache(cache);
        this.setModel(TokensModel);
    }

    public getRawTokens(uid: ObjectId) {
        return this.find({ user: uid }, { select: "-uesr" });
    }

    public async getTokens(uid: ObjectId) {
        return (await this.getRawTokens(uid))
            .map((item) => item.toObject())
            .map((item) => {
                item.token = "...." + item.token.substr(-8);
                return item;
            });
    }

    public async getIdByToken(token: string) {
        const t = await this.findOne({ token });
        if (t) {
            return t._id as ObjectId;
        }
        throw new BadRequestException("The token isnt exist");
    }

    public remove(obj: object) {
        return this.delete(obj);
    }

    /**
     * 检查`Token`是否可用
     * @param username
     * @param token
     */
    public async isVaild(username: string, token: string) {
        const obj = await this.findObject({ token }, { populate: "user" });
        if (!obj) {
            return false;
        }
        const tokenOwn = obj.user as IUser;
        return tokenOwn.username === username && tokenOwn.active;
    }

}
