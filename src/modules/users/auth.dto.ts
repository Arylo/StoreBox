import { IsString } from "class-validator";
import { ApiModelProperty } from "@nestjs/swagger";

export class LoginDto {
    @ApiModelProperty({ type: String })
    @IsString()
    public readonly username: string;
    @ApiModelProperty({ type: String })
    @IsString()
    public readonly password: string;
}
