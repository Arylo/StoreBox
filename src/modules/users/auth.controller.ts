import { Controller, Post, Res, Body, HttpStatus, Session, Get } from "@nestjs/common";
import { LoginDto } from "./auth.dto";
import { Model as UserModel, UserDoc  } from "@models/User";

@Controller("auth")
export class AuthController {

    @Post("login")
    public async login(@Res() res, @Body() user: LoginDto, @Session() session) {
        let userInfo: UserDoc = null;
        try {
            userInfo = await UserModel.isVaild(user.username, user.password);
        } catch (error) {
            res.status(HttpStatus.NOT_FOUND).send(error.toString());
        }
        session.regenerate((err) => {
            if (err) {
                res.status(HttpStatus.GATEWAY_TIMEOUT).send(err.toString());
                return;
            }
            session.loginUser = userInfo.toObject().username;
        });
        res.status(HttpStatus.OK).json({ });
    }

    @Get("logout")
    public logout(@Res() res, @Session() session) {
        session.destroy((err) => {
            if (err) {
                res.status(HttpStatus.GATEWAY_TIMEOUT).send(err.toString());
                return;
            }
            res.status(HttpStatus.OK).json({ });
        });
    }

}
