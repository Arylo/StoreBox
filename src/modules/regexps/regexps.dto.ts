import { IsString, IsMongoId, IsOptional } from "class-validator";
import { ObjectId } from "@models/common";
import { ApiModelProperty, ApiModelPropertyOptional } from "@nestjs/swagger";

interface IRegexp {
    name?: string;
    value?: string;
    link?: ObjectId;
}

export interface INewRegexp extends IRegexp {
    name: string;
    value: string;
}

export class EditRegexpRawDot implements IRegexp {
    public name?: string;
    public value?: string;
    public link?: ObjectId;
}

export class NewRegexp implements INewRegexp {
    @ApiModelProperty({ type: String })
    @IsString()
    public readonly name: string;
    @ApiModelProperty({ type: String })
    @IsString()
    public readonly value: string;
    @ApiModelPropertyOptional({ type: String })
    @IsOptional()
    @IsMongoId()
    public readonly link: ObjectId;
}

export class EditRegexpDot implements IRegexp {
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
    @IsMongoId()
    public readonly link: ObjectId;
}
