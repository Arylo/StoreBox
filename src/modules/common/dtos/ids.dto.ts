import { ObjectId } from "@models/common";
import { ApiModelProperty } from "@nestjs/swagger";
import { IsMongoId } from "class-validator";

export interface IIdDto {
    /**
     * MongoID
     */
    readonly id: ObjectId;
}

export class IdDto implements IIdDto {
    @ApiModelProperty({ type: String, description: "ID" })
    @IsMongoId()
    public readonly id: ObjectId;
}

export interface ICidDto {
    /**
     * Category or Collection MongoID
     */
    readonly cid: ObjectId;
}

/**
 * The Dto for Category ID
 */
export class CidDto implements ICidDto {
    @ApiModelProperty({ type: String, description: "Category ID" })
    @IsMongoId()
    public readonly cid: ObjectId;
}

/**
 * The Dto for Collection ID
 */
export class CCidDto implements ICidDto {
    @ApiModelProperty({ type: String, description: "Collection ID" })
    @IsMongoId()
    public readonly cid: ObjectId;
}

export interface IAidDto {
    /**
     * Attribute MongoID
     */
    readonly aid: ObjectId;
}

export class AidDto implements IAidDto {
    @ApiModelProperty({ type: String, description: "Attribute ID" })
    @IsMongoId()
    public readonly aid: ObjectId;
}

export interface IRidDto {
    /**
     * Regexp MongoID
     */
    readonly rid: ObjectId;
}

export class RidDto implements IRidDto {
    @ApiModelProperty({ type: String, description: "Regexp ID" })
    @IsMongoId()
    public readonly rid: ObjectId;
}

export interface IGidDto {
    /**
     * Good MongoID
     */
    readonly gid: ObjectId;
}

export class GidDto implements IGidDto {
    @ApiModelProperty({ type: String, description: "Good ID" })
    @IsMongoId()
    public readonly gid: ObjectId;
}

export class UGidDto implements IGidDto {
    @ApiModelProperty({ type: String, description: "Usergroup ID" })
    @IsMongoId()
    public readonly gid: ObjectId;
}

export interface IUidDto {
    /**
     * User MongoID
     */
    readonly uid: ObjectId;
}

export class UidDto implements IUidDto {
    @ApiModelProperty({ type: String, description: "User ID" })
    @IsMongoId()
    public readonly uid: ObjectId;
}

export interface ITidDto {
    /**
     * Tag Group ID
     */
    readonly tid: ObjectId;
}
