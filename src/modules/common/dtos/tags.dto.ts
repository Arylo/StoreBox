import { ITidDto } from "@dtos/ids";
import { ObjectId } from "@models/common";
import {
    IsMongoId, IsOptional, IsString, IsBoolean, IsArray
} from "class-validator";
import { ApiModelProperty, ApiModelPropertyOptional } from "@nestjs/swagger";
import { ITagRaw } from "@models/Tag";

export class TidDto implements ITidDto {
    @ApiModelProperty({ type: String, description: "Tag Group ID" })
    @IsMongoId()
    public readonly tid: ObjectId;
}

export class AddDto implements ITagRaw {
    @ApiModelProperty({ type: String })
    @IsString()
    public readonly name: string;
    @ApiModelProperty({ type: String, isArray: true })
    @IsString({ each: true })
    @IsArray()
    public readonly tags: string[];
    @ApiModelPropertyOptional({ type: Boolean })
    @IsOptional()
    @IsBoolean()
    public readonly hidden?: boolean;
}

export type IEditContent = {
    [K in keyof ITagRaw]?: ITagRaw[K];
};

export class EditDto implements IEditContent {
    @ApiModelPropertyOptional({ type: String })
    @IsOptional()
    @IsString()
    public readonly name?: string;
    @ApiModelPropertyOptional({ type: String, isArray: true })
    @IsOptional()
    @IsString({ each: true })
    public readonly tags?: string[];
    @ApiModelPropertyOptional({ type: Boolean })
    @IsOptional()
    @IsBoolean()
    public readonly hidden?: boolean;
}
