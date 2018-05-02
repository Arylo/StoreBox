import {
    UseGuards, Controller, Get, Param, Session, HttpStatus, HttpCode, Delete,
    BadRequestException, ForbiddenException
} from "@nestjs/common";
import { ApiUseTags, ApiResponse, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Roles } from "@decorators/roles";
import { RolesGuard } from "@guards/roles";
import { TokensService } from "@services/tokens";
import { UtilService } from "@services/util";
import { DefResDto } from "@dtos/res";
import { ListResponse } from "@dtos/page";
import { TokenParamDto } from "./tokens.dto";

@UseGuards(RolesGuard)
@Controller("api/v1/tokens")
// region Swagger Docs
@ApiUseTags("Tokens")
@ApiBearerAuth()
// endregion Swagger Docs
export class TokensAdminController {

    constructor(private readonly tokensSvr: TokensService) { }

    @Roles("admin")
    @Get()
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Self Tokens" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Get Tokens List",
        type: ListResponse
    })
    // endregion Swagger Docs
    public async getTokens(@Session() session) {
        const arr = await this.tokensSvr.getTokens(session.loginUserId);
        return UtilService.toListRespone(arr);
    }

    @Roles("admin")
    @Delete(":tid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete User's Token" })
    @ApiResponse({ status: HttpStatus.OK, description: "Delete Token Success" })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST, description: "Delete Token Fail"
    })
    // endregion Swagger Docs
    public deleteTokenByDelete(
        @Param() param: TokenParamDto, @Session() session
    ) {
        return this.deleteTokenByGet(param, session);
    }

    @Roles("admin")
    @Get(":tid/delete")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete User's Token" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete Token Success",
        type: DefResDto
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST, description: "Delete Token Fail"
    })
    // endregion Swagger Docs
    public async deleteTokenByGet(
        @Param() param: TokenParamDto, @Session() session
    ) {
        const token = await this.tokensSvr.remove({
            _id: param.tid,
            user: session.loginUserId
        });
        if (!token) {
            throw new BadRequestException("The Tokens isth exist");
        }
        return new DefResDto();
    }
}
