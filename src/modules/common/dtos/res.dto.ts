import { HttpStatus } from "@nestjs/common";
import { ApiModelProperty } from "@nestjs/swagger";

export class DefResDto {
    @ApiModelProperty({
        type: Number, description: "Status Code", default: HttpStatus.OK
    })
    public statusCode = HttpStatus.OK;
}
