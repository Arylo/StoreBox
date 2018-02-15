import {
    Controller, Post, Res, Body, HttpStatus, Session, Get, BadRequestException,
    GatewayTimeoutException, Query, UseGuards, Req
} from "@nestjs/common";
import {
    ApiUseTags, ApiBearerAuth, ApiResponse, ApiOperation
} from "@nestjs/swagger";
import uuid = require("uuid");
import basicAuth = require("basic-auth");
import { Model as UserModel, UserDoc  } from "@models/User";
import { Model as TokensModel } from "@models/Token";
import { RolesGuard } from "@guards/roles";
import { TokensService } from "@services/tokens";
import { LoginBodyDto, LoginQueryDto, LoginRespone } from "./auth.dto";

@UseGuards(RolesGuard)
@ApiUseTags("auth")
@Controller("api/v1/auth")
export class AuthAdminController {

    constructor(private readonly tokensSvr: TokensService) { }

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
        let user: UserDoc = null;
        try {
            user = await UserModel.isVaild(ctx.username, ctx.password);
        } catch (err) {
            throw new BadRequestException(err.toString());
        }
        session.loginUser = user.toObject().username;
        session.loginUserId = user.toObject()._id;
        const obj = new LoginRespone();
        obj.username = user.toObject().username;
        obj.nickname = user.toObject().nickname;
        obj.id = user.toObject()._id;
        if (query.token) {
            const token = uuid();
            try {
                await this.tokensSvr.create({
                    token, user: session.loginUserId
                });
            } catch (error) {
                throw new BadRequestException(error.toString());
            }
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
