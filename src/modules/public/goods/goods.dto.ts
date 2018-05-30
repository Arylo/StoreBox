import { PerPageDto } from "@dtos/page";
import { ApiModelProperty, ApiModelPropertyOptional } from "@nestjs/swagger";
import { IsNumberString, IsOptional, IsString } from "class-validator";

export class GoodsQueryDto extends PerPageDto {
    @ApiModelPropertyOptional({ type: String, isArray: true })
    @IsString({
        each: true
    })
    public readonly tags: string[];
    @ApiModelPropertyOptional({ type: String, isArray: true })
    @IsOptional()
    @IsString({
        each: true
    })
    public readonly macaddr: string[];
}
