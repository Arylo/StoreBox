import { IsString, IsOptional, IsIn } from "class-validator";
import { ApiModelProperty, ApiModelPropertyOptional } from "@nestjs/swagger";
import { ObjectId } from "@models/common";

export class LoginBodyDto {
    @ApiModelProperty({ type: String })
    @IsString()
    public readonly username: string;
    @ApiModelProperty({ type: String })
    @IsString()
    public readonly password: string;
}

class TokenQueryDto {
    @IsIn(["true", "false"])
    @IsOptional()
    public readonly token: boolean;
}

export class LoginQueryDto extends TokenQueryDto { }

export class LogoutQueryDto extends TokenQueryDto { }

export class LoginRespone {
    @ApiModelProperty({ type: Date })
    public expires: Date;
    @ApiModelProperty({ type: String })
    public username: string;
    @ApiModelProperty({ type: String })
    public nickname: string;
    @ApiModelProperty({ type: String })
    public id: ObjectId;
    @ApiModelPropertyOptional({ type: String })
    public token: string;
}
