import { IsString, IsMongoId, IsOptional } from "class-validator";
import { ObjectId } from "@models/common";
import { ApiModelProperty, ApiModelPropertyOptional } from "@nestjs/swagger";

export class NewRegexp {
    @ApiModelProperty({ type: String })
    @IsString()
    public readonly name: string;
    @ApiModelProperty({ type: String })
    @IsString()
    public readonly value: string;
}

export class CommonRegexpDot {
    @ApiModelProperty({ type: String })
    @IsMongoId()
    public readonly id: ObjectId;
}

interface IEditRegexp {
    name?: string;
    value?: string;
    link?: ObjectId;
}

export class EditRegexpDot implements IEditRegexp {
    @ApiModelPropertyOptional({ type: String })
    @IsOptional()
    @IsString()
    public readonly name: string;
    @ApiModelPropertyOptional({ type: String })
    @IsOptional()
    @IsString()
    public readonly value: string;
    @ApiModelPropertyOptional({ type: String })
    @IsOptional()
    @IsString()
    public readonly link: ObjectId;
}

export class EditRegexpRawDot implements IEditRegexp {
    public name?: string;
    public value?: string;
    public link?: ObjectId;
}
