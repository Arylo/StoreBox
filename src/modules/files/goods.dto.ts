import { IsString, IsNumberString, IsOptional } from "class-validator";
import { ApiModelPropertyOptional, ApiModelProperty } from "@nestjs/swagger";
import { PerPageDto } from "@dtos/page";

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
