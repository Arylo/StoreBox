import {
    UseGuards, Controller, Get, Param, Session, HttpStatus, HttpCode, Delete,
    BadRequestException, ForbiddenException
} from "@nestjs/common";
import { ApiUseTags, ApiResponse, ApiOperation } from "@nestjs/swagger";
import { Model as TokensModel } from "@models/Token";
import { Roles } from "@decorators/roles";
import { RolesGuard } from "@guards/roles";
import { TokensService } from "@services/tokens";
import { DefResDto } from "@dtos/res";
import { ListResponse } from "@dtos/page";
import { TokenParamDto } from "./tokens.dto";

@UseGuards(RolesGuard)
@ApiUseTags("Tokens")
@Controller("api/v1/tokens")
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
        const data = new ListResponse();
        data.current = data.totalPages = 1;
        data.data = await this.tokensSvr.getTokens(session.loginUserId);
        data.total = data.data.length;
        return data;
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
        try {
            const token = await this.tokensSvr.remove({
                _id: param.tid,
                user: session.loginUserId
            });
            if (!token) {
                throw new BadRequestException("The Tokens isth exist");
            }
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        return new DefResDto();
    }
}
