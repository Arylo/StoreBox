import {
    Controller, Get, Post, Body, Res, HttpStatus, Req, BadRequestException
} from "@nestjs/common";
import { Model as UserModel, IUser } from "@models/User";
import { CreateUserDto, ModifyPasswordDto, CommonUserDot } from "./users.dto";

@Controller("users")
export class UsersController {

    @Get()
    public async findAll(@Res() res) {
        res.status(HttpStatus.OK).json(
            await UserModel.list()
        );
    }

    @Post()
    public async addUser(@Res() res, @Body() user: CreateUserDto) {
        try {
            await UserModel.addUser(user.username, user.password);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        res.status(HttpStatus.CREATED).json({ });
    }

    @Post("/:id/password")
    public async password(@Res() res, @Body() user: ModifyPasswordDto) {
        try {
            await UserModel.passwd(user.id, user.oldPassword, user.newPassword);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        res.status(HttpStatus.OK).send();
    }

    @Post("/:id/delete")
    public async delete(@Res() res, @Body() user: CommonUserDot) {
        try {
            await UserModel.removeUser(user.id);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        res.status(HttpStatus.OK).json({ });
    }

    @Post("/:id/ban")
    public async ban(@Res() res, @Body() user: CommonUserDot) {
        try {
            await UserModel.ban(user.id);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        res.status(HttpStatus.OK).json({ });
    }

    @Post("/:id/allow")
    public async allow(@Res() res, @Body() user: CommonUserDot) {
        try {
            await UserModel.allow(user.id);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        res.status(HttpStatus.OK).json({ });
    }
}
