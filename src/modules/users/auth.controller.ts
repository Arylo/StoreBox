import {
    Controller, Post, Res, Body, HttpStatus, Session, Get, HttpException
} from "@nestjs/common";
import { LoginDto } from "./auth.dto";
import { Model as UserModel, UserDoc  } from "@models/User";

@Controller("auth")
export class AuthController {

    @Post("login")
    public async login(@Res() res, @Body() ctx: LoginDto, @Session() session) {
        let user: UserDoc = null;
        try {
            user = await UserModel.isVaild(ctx.username, ctx.password);
        } catch (err) {
            throw new HttpException(err.toString(), HttpStatus.NOT_FOUND);
        }
        session.regenerate((err) => {
            if (err) {
                throw new HttpException(
                    err.toString(), HttpStatus.GATEWAY_TIMEOUT
                );
            }
            session.loginUser = user.toObject().username;
            res.status(HttpStatus.OK).json({ });
        });
    }

    @Get("logout")
    public logout(@Res() res, @Session() session) {
        session.destroy((err) => {
            if (err) {
                throw new HttpException(
                    err.toString(), HttpStatus.GATEWAY_TIMEOUT
                );
            }
            res.status(HttpStatus.OK).json({ });
        });
    }

}
