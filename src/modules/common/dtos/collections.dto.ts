import { ApiModelProperty, ApiModelPropertyOptional } from "@nestjs/swagger";
import { ObjectId } from "@models/common";
import {
    IsMongoId, Matches, ArrayUnique, IsOptional, IsArray
} from "class-validator";

export interface ICollection {
    name?: string;
    goods: ObjectId[];
    creator?: ObjectId;
}

const NAME_REGEXP = /^[\da-z]\w{2}[\w ]*[\da-z]$/i;

export class GetCollectionNameDto {
    @ApiModelProperty({
        type: String,
        description: `Collection Name[${NAME_REGEXP}]`
    })
    @Matches(NAME_REGEXP)
    public readonly name: string;
}

export class CreateCollectionDto implements IEditCollection {
    @ApiModelPropertyOptional({
        type: String,
        description: `Collection Name[${NAME_REGEXP}]`
    })
    @IsOptional()
    @Matches(NAME_REGEXP)
    public readonly name?: string;
    @ApiModelProperty({ type: Array, description: "Good Ids" })
    @IsArray()
    @IsMongoId({ each: true })
    @ArrayUnique()
    public readonly goods: ObjectId[];
}

export interface IEditCollection {
    name?: string;
    goods?: ObjectId[];
}

export class EditCollectionDto implements IEditCollection {
    @ApiModelPropertyOptional({
        type: String,
        description: `Collection Name[${NAME_REGEXP}]`
    })
    @IsOptional()
    @Matches(NAME_REGEXP)
    public readonly name?: string;
    @ApiModelPropertyOptional({ type: Array, description: "Good Ids" })
    @IsOptional()
    @IsMongoId({ each: true })
    @ArrayUnique()
    public readonly goods?: ObjectId[];
}
