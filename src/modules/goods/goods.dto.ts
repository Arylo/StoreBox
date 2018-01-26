import { IGidDto, IAidDto } from "@dtos/ids";
import { ApiModelProperty } from "@nestjs/swagger";
import { IsMongoId } from "class-validator";
import { ObjectId } from "@models/common";

export class GoodAttributeParamDto implements IGidDto, IAidDto {
    @ApiModelProperty({ type: String, description: "Good ID" })
    @IsMongoId()
    public readonly gid: ObjectId;
    @ApiModelProperty({ type: String, description: "Attribute ID" })
    @IsMongoId()
    public readonly aid: ObjectId;
}