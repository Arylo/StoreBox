import { ApiModelProperty } from "@nestjs/swagger";
import { IsString, IsMongoId } from "class-validator";
import { ObjectId } from "@models/common";

export class AddUsergroupDto {
    @ApiModelProperty({ type: String, description: "Usergroup Name" })
    @IsString()
    public readonly name: string;
}

export class EditUsergroupDto {
    @ApiModelProperty({ type: String, description: "Usergroup Name" })
    @IsString()
    public readonly name: string;
}
