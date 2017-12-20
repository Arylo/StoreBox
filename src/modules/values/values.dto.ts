import { IsString, IsOptional } from "class-validator";

export class CreateValueDto {
    @IsString()
    public readonly key: string;
    @IsString()
    public readonly value: string;
}

export class EditValueDto {
    @IsString()
    public readonly value: string;
}
