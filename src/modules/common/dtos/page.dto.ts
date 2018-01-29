import { IsIn, IsOptional, IsNumberString } from "class-validator";
import { ApiModelPropertyOptional, ApiModelProperty } from "@nestjs/swagger";

export const PER_COUNT = [ 25, 50, 75 ];

export class ListResponse<T> {
    @ApiModelProperty({
        type: Array, description: "Data Set"
    })
    public data: T[] = [ ];
    @ApiModelProperty({
        type: Number, description: "Current Page"
    })
    public current: number;
    @ApiModelProperty({
        type: Number, description: "Total Page Count"
    })
    public totalPages: number;
    @ApiModelProperty({
        type: Number, description: "Total Item Count"
    })
    public total = 0;
}

export class PerPageDto {
    @ApiModelPropertyOptional({
        type: Number, default: PER_COUNT[0],
        description: `Display items count[${PER_COUNT.join(", ")}] per page`
    })
    @IsIn([...PER_COUNT].map((num) => "" + num)) // Because it is NumberString
    @IsNumberString()
    @IsOptional()
    public readonly perNum: number;
    @ApiModelPropertyOptional({
        type: Number, description: "No. page", default: 1
    })
    @IsNumberString()
    @IsOptional()
    public readonly page: number;
}
