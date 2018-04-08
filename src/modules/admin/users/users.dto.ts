import { IsString, IsMongoId } from "class-validator";
import { ObjectId } from "@models/common";
import { ApiUseTags, ApiModelProperty } from "@nestjs/swagger";
import { IUidDto, IGidDto } from "@dtos/ids";

export class CreateUserDto {
    @ApiModelProperty({ type: String, description: "Username" })
    @IsString()
    public readonly username: string;
    @ApiModelProperty({ type: String, description: "Password" })
    @IsString()
    public readonly password: string;
}

export class EditUserDto {
    @ApiModelProperty({ type: String, description: "Nickname" })
    @IsString()
    public readonly nickname: string;
}

export class ModifyPasswordDto {
    @ApiModelProperty({ type: String, description: "Old Password" })
    @IsString()
    public readonly oldPassword: string;
    @ApiModelProperty({ type: String, description: "New Password" })
    @IsString()
    public readonly newPassword: string;
}

export class UsergroupBodyDto {
    @ApiModelProperty({ type: String, description: "Action" })
    @IsString()
    public readonly type: "add" | "remove";
    @ApiModelProperty({ type: String, description: "Usergroup ID" })
    @IsMongoId({ each: true })
    public readonly gids: ObjectId;
}
