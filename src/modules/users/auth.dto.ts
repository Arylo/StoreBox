import { IsString, IsOptional, IsIn } from "class-validator";
import { ApiModelProperty } from "@nestjs/swagger";

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
