import {
    Controller, Get, Post, Body, Res, HttpStatus, Req, BadRequestException,
    Param, UseGuards, Query, Delete, HttpCode, Session, ForbiddenException
} from "@nestjs/common";
import {
    ApiBearerAuth, ApiUseTags, ApiResponse, ApiOperation, ApiImplicitParam
} from "@nestjs/swagger";
import { Model as UserModel, IUser, UserDoc } from "@models/User";
import { Model as TokensModel } from "@models/Token";
import { Model as GoodsModels } from "@models/Good";
import { ObjectId } from "@models/common";
import { Roles } from "@decorators/roles";
import { RolesGuard } from "@guards/roles";
import { ParseIntPipe } from "@pipes/parse-int";
import { PerPageDto, ListResponse, PER_COUNT } from "@dtos/page";
import { UidDto } from "@dtos/ids";

import {
    CreateUserDto, ModifyPasswordDto, UserTokenParamDto
} from "./users.dto";

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
        const totalPages = await UserModel.countUsers(query.perNum);
        const totalCount = await UserModel.countUsers();

        const data = new ListResponse<IUser | UserDoc>();
        data.current = curPage;
        data.totalPages = totalPages;
        data.total = totalCount;
        if (totalPages >= curPage) {
            data.data = await UserModel.list(query.perNum, query.page);
        }
        return data;
    }

    @Roles("admin")
    @Post()
    // region Swagger Docs
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ title: "Add User" })
    @ApiResponse({
        status: HttpStatus.CREATED, description: "Add User Success"
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST, description: "Add User Fail"
    })
    // endregion Swagger Docs
    public async addUser(@Body() user: CreateUserDto) {
        let obj;
        try {
            obj = await UserModel.addUser(user.username, user.password);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        return obj;
    }

    @Roles("admin")
    @Post("/:uid/password")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Modify User Password" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Modify Password Success"
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST, description: "Modify Password Fail"
    })
    // endregion Swagger Docs
    public async password(
        @Body() user: ModifyPasswordDto, @Param() param: UidDto
    ) {
        try {
            await UserModel.passwd(param.uid, user.oldPassword, user.newPassword);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        return { statusCode: HttpStatus.OK };
    }

    @Roles("admin")
    @Delete("/:uid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete User" })
    @ApiResponse({ status: HttpStatus.OK, description: "Delete User Success" })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST, description: "Delete User Fail"
    })
    // endregion Swagger Docs
    public deleteByDelete(@Param() user: UidDto) {
        return this.delete(user);
    }

    @Roles("admin")
    @Get("/:uid/delete")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete User" })
    @ApiResponse({ status: HttpStatus.OK, description: "Delete User Success" })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST, description: "Delete User Fail"
    })
    // endregion Swagger Docs
    public async delete(@Param() user: UidDto) {
        try {
            await UserModel.removeUser(user.uid);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        return { statusCode: HttpStatus.OK };
    }

    @Roles("admin")
    @Get("/:uid/ban")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Ban User" })
    @ApiResponse({ status: HttpStatus.OK, description: "Ban Success" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Ban Fail" })
    // endregion Swagger Docs
    public async ban(@Param() user: UidDto) {
        try {
            await UserModel.ban(user.uid);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        return { statusCode: HttpStatus.OK };
    }

    @Roles("admin")
    @Get("/:uid/allow")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Allow User" })
    @ApiResponse({ status: HttpStatus.OK, description: "Allow Success" })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Allow Fail" })
    // endregion Swagger Docs
    public async allow(@Param() user: UidDto) {
        try {
            await UserModel.allow(user.uid);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        return { statusCode: HttpStatus.OK };
    }

    @Roles("admin")
    @Get("/:uid/tokens")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get User's Tokens" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Get User's Tokens List",
        type: ListResponse
    })
    // endregion Swagger Docs
    public async getTokens(@Param() param: UidDto, @Session() session) {
        const data = new ListResponse();
        data.current = data.totalPages = 1;
        data.data =
            (await TokensModel
                .find({ user: session.loginUserId })
                .select("-user")
                .exec()
            )
            .map((item) => item.toObject())
            .map((item) => {
                item.token = "...." + item.token.substr(-8);
                return item;
            });
        data.total = data.data.length;
        return data;
    }

    @Roles("admin")
    @Delete("/:uid/tokens/:tid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete User's Token" })
    @ApiResponse({ status: HttpStatus.OK, description: "Delete Token Success" })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST, description: "Delete Token Fail"
    })
    // endregion Swagger Docs
    public deleteTokenByDelete(
        @Param() param: UserTokenParamDto, @Session() session
    ) {
        return this.deleteTokenByGet(param, session);
    }

    @Roles("admin")
    @Get("/:uid/tokens/:tid/delete")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete User's Token" })
    @ApiResponse({ status: HttpStatus.OK, description: "Delete Token Success" })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST, description: "Delete Token Fail"
    })
    // endregion Swagger Docs
    public async deleteTokenByGet(
        @Param() param: UserTokenParamDto, @Session() session
    ) {
        if (session.loginUserId !== param.uid) {
            throw new ForbiddenException("It isnt your token");
        }
        try {
            await TokensModel.findOneAndRemove({
                _id: param.tid,
                user: param.uid
            }).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        return { statusCode: HttpStatus.OK };
    }

    private async getGoodsRes(uid: ObjectId, query: PerPageDto) {
        const curPage = query.page || 1;
        const perNum = query.perNum || PER_COUNT[0];
        const totalPages =
            await GoodsModels.countGoodsByUids(uid, query.perNum);
        const totalCount = await GoodsModels.countGoodsByUids(uid);

        const resData = new ListResponse();
        resData.current = curPage;
        resData.totalPages = totalPages;
        resData.total = totalCount;
        if (totalPages >= curPage) {
            resData.data = await GoodsModels.getGoodsByUids(
                uid, query.perNum, query.page
            );
        }
        return resData;
    }

    @Roles("admin", "token")
    @Get("/goods")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Self Goods List" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Self Goods List",
        type: ListResponse
    })
    // endregion Swagger Docs
    public getSelfGoods(
        @Session() session, @Query(new ParseIntPipe()) query: PerPageDto
    ) {
        const userId: ObjectId = session.loginUserId;
        return this.getGoodsRes(userId, query);
    }

    @Roles("admin")
    @Get("/:uid/goods")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get User's Goods List" })
    @ApiResponse({
        status: HttpStatus.OK, description: "User's Goods List",
        type: ListResponse
    })
    // endregion Swagger Docs
    public async getUserGoods(
        @Param() param: UidDto, @Query(new ParseIntPipe()) query: PerPageDto
    ) {
        const userId: ObjectId = param.uid;
        return this.getGoodsRes(userId, query);
    }
}
