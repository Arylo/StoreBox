import { IGidDto, IUidDto } from "@dtos/ids";
import { ObjectId } from "@models/common";
import { ApiModelProperty } from "@nestjs/swagger";
import { IsMongoId, IsString } from "class-validator";

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

export class UserUsergroupDto implements IGidDto, IUidDto {
    @ApiModelProperty({ type: String, description: "User ID" })
    @IsMongoId()
    public readonly uid: ObjectId;
    @ApiModelProperty({ type: String, description: "Usergroup ID" })
    @IsMongoId()
    public readonly gid: ObjectId;
}
