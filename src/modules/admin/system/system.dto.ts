import { ApiModelProperty } from "@nestjs/swagger";
import { DEFAULTS } from "@services/system";
import { IsString } from "class-validator";

export class EditSystemVarDto {
    @ApiModelProperty({ type: String })
    @IsString()
    public readonly key: DEFAULTS;
    @ApiModelProperty({ type: String })
    @IsString()
    public readonly value: string;
}
