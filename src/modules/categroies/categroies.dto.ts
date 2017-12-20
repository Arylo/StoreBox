import {
    IsMongoId, IsString, IsArray, ArrayUnique, IsOptional, IsJSON
} from "class-validator";
import { ObjectId } from "@models/common";

export class NewCategroyDto {
    @IsString()
    public readonly name: string;

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsString({
        each: true
    })
    public readonly tags: string[];

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsJSON({
        each: true
    })
    public readonly attributes: string[];

    @IsOptional()
    @IsMongoId()
    public readonly pid: ObjectId;
}

export class EditCategroyDto {
    @IsOptional()
    @IsString()
    public readonly name: string;

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsString({
        each: true
    })
    public readonly tags: string[];

    @IsOptional()
    @IsMongoId()
    public readonly pid: ObjectId;
}
