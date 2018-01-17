import {
    Controller, Post, Res, Body, HttpStatus, Session, Get, BadRequestException,
    GatewayTimeoutException, Query
} from "@nestjs/common";
import {
    ApiUseTags, ApiBearerAuth, ApiResponse, ApiOperation
} from "@nestjs/swagger";
import { Model as UserModel, UserDoc  } from "@models/User";
import { Model as TokensModel } from "@models/Token";
import uuid = require("uuid");
import { LoginDto } from "./auth.dto";

@ApiUseTags("auth")
@Controller("api/v1/auth")
export class AuthController {

    @Post("login")
    @ApiOperation({ title: "Login System" })
    @ApiResponse({ status: HttpStatus.OK, description: "Login Success" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Login Fail" })
    public async login(
        @Session() session, @Body() ctx: LoginDto, @Query() query
    ) {
        let user: UserDoc = null;
        try {
            user = await UserModel.isVaild(ctx.username, ctx.password);
        } catch (err) {
            throw new BadRequestException(err.toString());
        }
        session.loginUser = user.toObject().username;
        session.loginUserId = user.toObject()._id;
        // session.regenerate((err) => {
        //     if (err) {
        //         throw new GatewayTimeoutException(err.toString());
        //     }
        // });
        const obj: any = { };
        if (query.token) {
            const token = uuid();
            try {
                await TokensModel.create({ token, user: session.loginUserId });
            } catch (error) {
                throw new BadRequestException("Generate Token Fail");
            }
            obj.token = token;
        }
        return obj;
    }

    @Get("logout")
    @ApiOperation({ title: "Logout System" })
    @ApiResponse({ status: HttpStatus.OK, description: "Logout Success" })
    @ApiResponse({
        status: HttpStatus.GATEWAY_TIMEOUT, description: "Logout Timeout"
    })
    public logout(@Res() res, @Session() session) {
        session.destroy((err) => {
            if (err) {
                throw new GatewayTimeoutException(err.toString());
            }
            res.status(HttpStatus.OK).json({ });
        });
    }

}
