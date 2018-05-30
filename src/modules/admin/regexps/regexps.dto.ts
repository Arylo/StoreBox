import { ObjectId } from "@models/common";
import { ApiModelProperty, ApiModelPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsMongoId, IsOptional, IsString } from "class-validator";

interface IRegexp {
    name?: string;
    value?: string;
    link?: ObjectId;
    hidden?: boolean;
}

export interface INewRegexp extends IRegexp {
    name: string;
    value: string;
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
    @ApiModelPropertyOptional({ type: Boolean, default: false })
    @IsOptional()
    @IsBoolean()
    public readonly hidden: boolean;
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
    @ApiModelPropertyOptional({ type: Boolean })
    @IsOptional()
    @IsBoolean()
    public readonly hidden: boolean;
}
