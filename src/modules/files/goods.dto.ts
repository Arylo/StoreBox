import { IsString, IsNumberString } from "class-validator";
import { ApiModelPropertyOptional, ApiModelProperty } from "@nestjs/swagger";
import { PerPageDto } from "../common/dtos/page.dto";

export class GoodsQueryDto extends PerPageDto {
    @ApiModelPropertyOptional({ type: String })
    @IsString({
        each: true
    })
    public readonly tags: string[];
}

export class GoodsResponseDto {
    @ApiModelPropertyOptional({ type: Date })
    public latest: Date;
    @ApiModelProperty({ type: Array })
    public data: any[] = [ ];
    @ApiModelProperty({ type: Number })
    public current: number = 1;
    @ApiModelProperty({ type: Number })
    public total: number = 0;
}
