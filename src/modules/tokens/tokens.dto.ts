import { ApiModelProperty } from "@nestjs/swagger";
import { IsMongoId } from "class-validator";
import { ObjectId } from "@models/common";

export class TokenParamDto {
    @ApiModelProperty({ type: String, description: "Token ID" })
    @IsMongoId()
    public readonly tid: ObjectId;
}
