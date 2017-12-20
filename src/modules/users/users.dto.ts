import { IsString, IsMongoId } from "class-validator";
import { ObjectId } from "@models/common";

export class CreateUserDto {
    @IsString()
    public readonly username: string;
    @IsString()
    public readonly password: string;
}

export class CommonUserDot {
    @IsMongoId()
    public readonly id: ObjectId;
}

export class ModifyPasswordDto extends CommonUserDot {
    @IsString()
    public readonly oldPassword: string;
    @IsString()
    public readonly newPassword: string;
}
