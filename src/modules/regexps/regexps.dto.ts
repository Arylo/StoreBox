import { IsString, IsMongoId } from "class-validator";
import { ObjectId } from "@models/common";
import { ApiModelProperty } from "@nestjs/swagger";

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

export class EditRegexpDot {
    @ApiModelProperty({ type: String })
    @IsString()
    public readonly name: string;
    @ApiModelProperty({ type: String })
    @IsString()
    public readonly value: string;
}
