import { RolesGuard } from "@guards/roles";
import {
    BadRequestException, Body, Controller, GatewayTimeoutException, Get, HttpStatus, Post, Query,
    Req, Res, Session, UseGuards
} from "@nestjs/common";
import {
    ApiBearerAuth, ApiOperation, ApiResponse, ApiUseTags
} from "@nestjs/swagger";
import { TokensService } from "@services/tokens";
import { UsersService } from "@services/users";
import basicAuth = require("basic-auth");
import uuid = require("uuid");
import { LoginBodyDto, LoginQueryDto, LoginRespone } from "./auth.dto";

@UseGuards(RolesGuard)
@ApiUseTags("auth")
@Controller("api/v1/auth")
export class AuthAdminController {

    constructor(
        private readonly usersSvr: UsersService,
        private readonly tokensSvr: TokensService
    ) { }

    @Post("login")
    @ApiOperation({ title: "Login System" })
    @ApiResponse({
        status: HttpStatus.OK, type: LoginRespone,
        description: "Login Success"
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Login Fail" })
    public async login(
        @Session() session,
        @Body() ctx: LoginBodyDto, @Query() query: LoginQueryDto
    ) {
        const user =
            await this.usersSvr.isVaild(ctx.username, ctx.password);
        session.loginUser = user.toObject().username;
        session.loginUserId = user.toObject()._id;
        const obj = new LoginRespone();
        obj.username = user.toObject().username;
        obj.nickname = user.toObject().nickname;
        obj.id = user.toObject()._id;
        if (query.token) {
            const token = uuid();
            await this.tokensSvr.create({
                token, user: session.loginUserId
            });
            obj.token = token;
        }
        obj.expires = session.cookie.maxAge || session.cookie.originalMaxAge;
        return obj;
    }

    @Get("logout")
    @ApiOperation({ title: "Logout System" })
    @ApiResponse({ status: HttpStatus.OK, description: "Logout Success" })
    @ApiResponse({
        status: HttpStatus.GATEWAY_TIMEOUT, description: "Logout Timeout"
    })
    public async logout(@Req() req, @Res() res, @Session() session) {
        const user = (req as any).user;
        if (user && user.token && !!~user.roles.indexOf("token")) {
            const token = user.token;
            await this.tokensSvr.remove({ token });
            res.status(HttpStatus.OK).json({ });
            return;
        } else {
            session.destroy((err) => {
                if (err) {
                    throw new GatewayTimeoutException(err.toString());
                }
                res.status(HttpStatus.OK).json({ });
            });
        }
    }

}
