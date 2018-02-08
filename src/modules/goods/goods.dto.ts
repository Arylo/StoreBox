import { IGidDto, IAidDto } from "@dtos/ids";
import { ApiModelProperty } from "@nestjs/swagger";
import { IsMongoId } from "class-validator";
import { ObjectId } from "@models/common";
import { IGoods } from "@models/Good";

export class GoodAttributeParamDto implements IGidDto, IAidDto {
    @ApiModelProperty({ type: String, description: "Good ID" })
    @IsMongoId()
    public readonly gid: ObjectId;
    @ApiModelProperty({ type: String, description: "Attribute ID" })
    @IsMongoId()
    public readonly aid: ObjectId;
}

export class GoodsDto {
    @ApiModelProperty({ type: String, description: "Collection Name" })
    public readonly name: string;
    @ApiModelProperty({ type: Object, description: "Goods", isArray: true })
    public readonly goods: IGoods[];
}
