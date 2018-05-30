import { ApiModelProperty } from "@nestjs/swagger";
import { IsMongoId } from "class-validator";

export class DownlaodDto {
    @ApiModelProperty({ type: String })
    @IsMongoId()
    public readonly cid: string;
    @ApiModelProperty({ type: String })
    @IsMongoId()
    public readonly id: string;
}
