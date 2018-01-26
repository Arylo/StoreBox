import {
    Controller, Get, Post, Body, Res, HttpStatus, Req, BadRequestException,
    Param, UseGuards, Query, Delete, HttpCode
} from "@nestjs/common";
import {
    ApiBearerAuth, ApiUseTags, ApiResponse, ApiOperation, ApiImplicitParam
} from "@nestjs/swagger";
import { Model as UserModel, IUser, UserDoc } from "@models/User";
import { Roles } from "@decorators/roles";
import { RolesGuard } from "@guards/roles";
import { PerPageDto, ListResponse } from "@dtos/page";
import { ParseIntPipe } from "@pipes/parse-int";

import { CreateUserDto, ModifyPasswordDto, CommonUserDot } from "./users.dto";

@UseGuards(RolesGuard)
@Controller("api/v1/users")
// region Swagger Docs
@ApiUseTags("users")
@ApiBearerAuth()
// endregion Swagger Docs
export class UsersAdminController {

    @Roles("admin")
    @Get()
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get User List" })
    @ApiResponse({
        status: HttpStatus.OK, description: "User List",
        type: ListResponse
    })
    // endregion Swagger Docs
    public async findAll(@Query(new ParseIntPipe()) query: PerPageDto) {
        const curPage = query.page || 1;
        const totalPage = await UserModel.pageCount(query.perNum);
        const data = new ListResponse<IUser | UserDoc>();
        data.current = curPage;
        data.total = totalPage;
        if (totalPage >= (query.page || 1)) {
            data.data = await UserModel.list(query.perNum, query.page);
        }
        return data;
    }

    @Roles("admin")
    @Post()
    // region Swagger Docs
    @ApiOperation({ title: "Add User" })
    @ApiResponse({
        status: HttpStatus.CREATED, description: "Add User Success"
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST, description: "Add User Fail"
    })
    // endregion Swagger Docs
    public async addUser(@Res() res, @Body() user: CreateUserDto) {
        try {
            await UserModel.addUser(user.username, user.password);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        res.status(HttpStatus.CREATED).json({ });
    }

    @Roles("admin")
    @Post("/:id/password")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Modify User Password" })
    @ApiImplicitParam({ name: "id", description: "User ID" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Modify Password Success"
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST, description: "Modify Password Fail"
    })
    // endregion Swagger Docs
    public async password(@Body() user: ModifyPasswordDto, @Param("id") id) {
        try {
            await UserModel.passwd(id, user.oldPassword, user.newPassword);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        return { };
    }

    @Roles("admin")
    @Delete("/:id")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete User" })
    @ApiImplicitParam({ name: "id", description: "User ID" })
    @ApiResponse({ status: HttpStatus.OK, description: "Delete User Success" })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST, description: "Delete User Fail"
    })
    // endregion Swagger Docs
    public deleteByDelete(@Param() user: CommonUserDot) {
        return this.delete(user);
    }

    @Roles("admin")
    @Get("/:id/delete")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete User" })
    @ApiImplicitParam({ name: "id", description: "User ID" })
    @ApiResponse({ status: HttpStatus.OK, description: "Delete User Success" })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST, description: "Delete User Fail"
    })
    // endregion Swagger Docs
    public async delete(@Param() user: CommonUserDot) {
        try {
            await UserModel.removeUser(user.id);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        return { };
    }

    @Roles("admin")
    @Get("/:id/ban")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Ban User" })
    @ApiImplicitParam({ name: "id", description: "User ID" })
    @ApiResponse({ status: HttpStatus.OK, description: "Ban Success" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Ban Fail" })
    // endregion Swagger Docs
    public async ban(@Param() user: CommonUserDot) {
        try {
            await UserModel.ban(user.id);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        return { };
    }

    @Roles("admin")
    @Get("/:id/allow")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Allow User" })
    @ApiImplicitParam({ name: "id", description: "User ID" })
    @ApiResponse({ status: HttpStatus.OK, description: "Allow Success" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Allow Fail" })
    // endregion Swagger Docs
    public async allow(@Param() user: CommonUserDot) {
        try {
            await UserModel.allow(user.id);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        return { };
    }
}
