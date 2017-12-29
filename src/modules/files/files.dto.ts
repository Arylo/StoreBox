import { IsMongoId } from "class-validator";

export class DownlaodDto {
    @IsMongoId()
    public readonly cid: string;
    @IsMongoId()
    public readonly id: string;
}
