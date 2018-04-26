import { IGidDto, IAidDto } from "@dtos/ids";
import { ApiModelProperty, ApiModelPropertyOptional } from "@nestjs/swagger";
import { IsMongoId, IsString, IsOptional } from "class-validator";
import { ObjectId } from "@models/common";
import { IGoods } from "@models/Good";
import { PerPageDto } from "@dtos/page";

export class GoodAttributeParamDto implements IGidDto, IAidDto {
    @ApiModelProperty({ type: String, description: "Good ID" })
    @IsMongoId()
    public readonly gid: ObjectId;
    @ApiModelProperty({ type: String, description: "Attribute ID" })
    @IsMongoId()
    public readonly aid: ObjectId;
}

export class GetGoodsDto extends PerPageDto {
    @ApiModelPropertyOptional({type: String, description: "Category ID"})
    @IsMongoId()
    @IsOptional()
    public readonly cid: ObjectId;
}

export class UploadQueryDto {
    @ApiModelProperty({
        type: String, description: "Category Name", isArray: true
    })
    @IsString({ each: true })
    @IsOptional()
    public readonly category?: string[];
    @ApiModelProperty({
        type: String, description: "Append Category Name", isArray: true
    })
    @IsString({ each: true })
    @IsOptional()
    public readonly append?: string[];
}

export class EditBodyDto {
    @ApiModelPropertyOptional({ type: String, description: "Good Name" })
    @IsOptional()
    public readonly name?: string;
    @ApiModelPropertyOptional({ type: Boolean })
    @IsOptional()
    public readonly hidden?: boolean;
    @ApiModelPropertyOptional({ type: String, description: "Category ID" })
    @IsOptional()
    public readonly category?: ObjectId;
    @ApiModelPropertyOptional({
        type: String, description: "Filename when download"
    })
    @IsOptional()
    public readonly originname?: string;
}
