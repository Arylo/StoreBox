import { Component, BadRequestException } from "@nestjs/common";
import { ObjectId } from "@models/common";
import { Model as UsersModel, UserDoc } from "@models/User";

@Component()
export class UsersService {

    /**
     * 修改`User`属性, 除了`username`
     * @param id User ID
     * @param content Content
     */
    public async modify(id: ObjectId, content): Promise<UserDoc> {
        if (content && content.username) {
            delete content.username;
        }
        if (Object.keys(content).length === 0) {
            throw new BadRequestException("Empty Content");
        }
        try {
            return await UsersModel.update({ _id: id }, content, {
                runValidators: true, context: "query"
            }).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }
}
