import { IsString, IsOptional } from "class-validator";
import { ApiModelProperty } from "@nestjs/swagger";

export class CreateValueDto {
    @ApiModelProperty({ type: String })
    @IsString()
    public readonly key: string;
    @ApiModelProperty({ type: String })
    @IsString()
    public readonly value: string;
}

export class EditValueDto {
    @ApiModelProperty({ type: String })
    @IsString()
    public readonly value: string;
}
