import { IsString, IsMongoId } from "class-validator";
import { ObjectId } from "@models/common";
import { ApiUseTags, ApiModelProperty } from "@nestjs/swagger";

export class CreateUserDto {
    @ApiModelProperty({ type: String, description: "Username" })
    @IsString()
    public readonly username: string;
    @ApiModelProperty({ type: String, description: "Password" })
    @IsString()
    public readonly password: string;
}

export class CommonUserDot {
    @ApiModelProperty({ type: String, description: "User ID" })
    @IsMongoId()
    public readonly id: ObjectId;
}

export class ModifyPasswordDto {
    @ApiModelProperty({ type: String, description: "Old Password" })
    @IsString()
    public readonly oldPassword: string;
    @ApiModelProperty({ type: String, description: "New Password" })
    @IsString()
    public readonly newPassword: string;
}
