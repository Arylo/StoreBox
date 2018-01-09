import { IsMongoId } from "class-validator";
import { ApiModelProperty } from "@nestjs/swagger";

export class DownlaodDto {
    @ApiModelProperty({ type: String })
    @IsMongoId()
    public readonly cid: string;
    @ApiModelProperty({ type: String })
    @IsMongoId()
    public readonly id: string;
}
