import { IsString, IsNumberString } from "class-validator";
import { ApiModelPropertyOptional, ApiModelProperty } from "@nestjs/swagger";
import { PerPageDto } from "@dtos/page";

export class GoodsQueryDto extends PerPageDto {
    @ApiModelPropertyOptional({ type: String })
    @IsString({
        each: true
    })
    public readonly tags: string[];
}
