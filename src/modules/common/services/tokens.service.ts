import { Component, BadRequestException } from "@nestjs/common";
import { ObjectId } from "@models/common";
import { Model as TokensModel } from "@models/Token";
import { IUser } from "@models/User";
import { IUidDto } from "@dtos/ids";

@Component()
export class TokensService {

    public async create(obj) {
        try {
            return await TokensModel.create(obj);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    public getRawTokens(uid: ObjectId) {
        return TokensModel
            .find({ user: uid })
            .select("-user")
            .exec();
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
        const t = await TokensModel.findOne({ token: token });
        if (t) {
            return t._id as ObjectId;
        } else {
            throw new BadRequestException("The token isnt exist");
        }
    }

    public async remove(obj) {
        try {
            return await TokensModel.findOneAndRemove(obj).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    /**
     * 检查`Token`是否可用
     * @param username
     * @param token
     */
    public async isVaild(username: string, token: string) {
        const t = await TokensModel.findOne({ token })
            .populate("user").exec();
        const tokenOwn = t.toObject().user as IUser;
        return tokenOwn.username === username && tokenOwn.active;
    }

}
