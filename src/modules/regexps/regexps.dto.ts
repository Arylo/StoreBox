import { IsString, IsMongoId } from "class-validator";
import { ObjectId } from "@models/common";

export class NewRegexp {
    @IsString()
    public readonly name: string;

    @IsString()
    public readonly value: string;
}

export class CommonRegexpDot {
    @IsMongoId()
    public readonly id: ObjectId;
}

export class EditRegexpDot extends CommonRegexpDot {
    @IsString()
    public readonly name: string;

    @IsString()
    public readonly value: string;
}

