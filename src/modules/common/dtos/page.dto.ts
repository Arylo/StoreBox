import { IsOptional, IsNumberString, Matches } from "class-validator";
import { ApiModelPropertyOptional, ApiModelProperty } from "@nestjs/swagger";

export const DEF_PER_COUNT = 25;

export class ListResponse<T> {
    @ApiModelProperty({
        type: Array, description: "Data Set"
    })
    public data: T[] = [ ];
    @ApiModelProperty({
        type: Number, description: "Current Page"
    })
    public current = 1;
    @ApiModelProperty({
        type: Number, description: "Total Page Count"
    })
    public totalPages: number;
    @ApiModelProperty({
        type: Number, description: "Total Item Count"
    })
    public total = 0;
}

export interface IPerPage {
    readonly perNum?: number;
    readonly page?: number;
}

export class PerPageDto implements IPerPage {
    @ApiModelPropertyOptional({
        type: Number, default: DEF_PER_COUNT,
        description: `Display items count[1...100] per page`
    })
    @IsNumberString()
    @Matches(/^[1-9]\d{0,2}$/)
    @IsOptional()
    public readonly perNum: number;
    @ApiModelPropertyOptional({
        type: Number, description: "No. page", default: 1
    })
    @IsNumberString()
    @IsOptional()
    public readonly page: number;
}
