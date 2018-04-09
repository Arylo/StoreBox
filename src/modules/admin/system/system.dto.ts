import { ApiModelProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { DEFAULTS } from "@services/system";

export class EditSystemVarDto {
    @ApiModelProperty({ type: String })
    @IsString()
    public readonly key: DEFAULTS;
    @ApiModelProperty({ type: String })
    @IsString()
    public readonly value: string;
}
