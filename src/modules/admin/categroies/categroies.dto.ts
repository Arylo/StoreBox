import {
    IsMongoId, IsString, IsArray, ArrayUnique, IsOptional, IsJSON
} from "class-validator";
import { ObjectId } from "@models/common";
import { ApiModelProperty, ApiModelPropertyOptional } from "@nestjs/swagger";
import { ICidDto, IAidDto } from "@dtos/ids";

export class NewCategoryDto {
    @ApiModelProperty({ type: String })
    @IsString()
    public readonly name: string;

    @ApiModelPropertyOptional({ type: String, isArray: true })
    @IsOptional()
    @IsString({
        each: true
    })
    public readonly tags: string[];

    @ApiModelPropertyOptional({ type: JSON, isArray: true })
    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsJSON({
        each: true
    })
    public readonly attributes: string[];

    @ApiModelPropertyOptional({ type: String })
    @IsOptional()
    @IsMongoId()
    public readonly pid: ObjectId;
}

export class EditCategoryDto {
    @ApiModelPropertyOptional({ type: String })
    @IsOptional()
    @IsString()
    public readonly name: string;

    @ApiModelPropertyOptional({ type: String, isArray: true })
    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsString({
        each: true
    })
    public readonly tags: string[];

    @ApiModelPropertyOptional({ type: String })
    @IsOptional()
    @IsMongoId()
    public readonly pid: ObjectId;
}

export class CategoryAttributeParamDto implements ICidDto, IAidDto {
    @ApiModelProperty({ type: String, description: "Category ID" })
    @IsMongoId()
    public readonly cid: ObjectId;
    @ApiModelProperty({ type: String, description: "Attribute ID" })
    @IsMongoId()
    public readonly aid: ObjectId;
}
