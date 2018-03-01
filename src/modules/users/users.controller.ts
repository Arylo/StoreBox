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
import { CollectionDoc } from "@models/Collection";
import { ObjectId } from "@models/common";
import { Roles } from "@decorators/roles";
import { RolesGuard } from "@guards/roles";
import { ParseIntPipe } from "@pipes/parse-int";
import { TokensService } from "@services/tokens";
import { UsergroupsService } from "@services/usergroups";
import { CollectionsService } from "@services/collections";
import { UsersService } from "@services/users";
import { PerPageDto, ListResponse, DEF_PER_COUNT } from "@dtos/page";
import { UidDto } from "@dtos/ids";
import { DefResDto } from "@dtos/res";

import {
    CreateUserDto, ModifyPasswordDto, EditUserDto, UserUsergroupParamDto
} from "./users.dto";

@UseGuards(RolesGuard)
@Controller("api/v1/users")
// region Swagger Docs
@ApiUseTags("users")
@ApiBearerAuth()
// endregion Swagger Docs
export class UsersAdminController {

    constructor(
        private readonly tokensSvr: TokensService,
        private readonly collectionsSvr: CollectionsService,
        private readonly usersSvr: UsersService,
        private readonly ugSvr: UsergroupsService
    ) { }

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
    @Post("/:uid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Edit User" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Edit User Success", type: DefResDto
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST, description: "Edit User Fail"
    })
    // endregion Swagger Docs
    public async edit(@Param() param: UidDto, @Body() body: EditUserDto) {
        await this.usersSvr.modify(param.uid, body);
        return new DefResDto();
    }

    @Roles("admin")
    @Post("/:uid/password")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Modify User Password" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Modify Password Success",
        type: DefResDto
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
        return new DefResDto();
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
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete User Success",
        type: DefResDto
    })
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
        return new DefResDto();
    }

    @Roles("admin")
    @Get("/:uid/ban")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Ban User" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Ban Success",
        type: DefResDto
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Ban Fail" })
    // endregion Swagger Docs
    public async ban(@Session() session, @Param() param: UidDto) {
        const curUserId = session.loginUserId;
        if (curUserId === param.uid) {
            throw new BadRequestException("Cant ban yourself account");
        }
        await this.usersSvr.modify(param.uid, { active: false });
        return new DefResDto();
    }

    @Roles("admin")
    @Get("/:uid/allow")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Allow User" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Allow Success",
        type: DefResDto
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Allow Fail" })
    // endregion Swagger Docs
    public async allow(@Param() param: UidDto) {
        await this.usersSvr.modify(param.uid, { active: true });
        return new DefResDto();
    }

    ////////////////////////////////////////
    // region Token Methods
    ////////////////////////////////////////

    @Roles("admin")
    @Get("/tokens")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Self Tokens" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Get Self Tokens List",
        type: ListResponse
    })
    // endregion Swagger Docs
    public async getSelfTokens(@Session() session) {
        const data = new ListResponse();
        data.current = data.totalPages = 1;
        data.data = await this.tokensSvr.getTokens(session.loginUserId);
        data.total = data.data.length;
        return data;
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
        data.data = await this.tokensSvr.getTokens(param.uid);
        data.total = data.data.length;
        return data;
    }

    ////////////////////////////////////////
    // endregion Token Methods
    ////////////////////////////////////////

    ////////////////////////////////////////
    // region Good Methods
    ////////////////////////////////////////

    private async getGoodsRes(uid: ObjectId, query: PerPageDto) {
        const curPage = query.page || 1;
        const perNum = query.perNum || DEF_PER_COUNT;
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

    ////////////////////////////////////////
    // endregion Good Methods
    ////////////////////////////////////////

    ////////////////////////////////////////
    // region Collection Methods
    ////////////////////////////////////////

    private async getCollectionsRes(uid: ObjectId, query: PerPageDto) {
        const curPage = query.page || 1;
        const perNum = query.perNum || DEF_PER_COUNT;
        const totalPages =
            await this.collectionsSvr.countPage(uid, query.perNum);
        const totalCount = await this.collectionsSvr.count(uid);

        const resData = new ListResponse<CollectionDoc>();
        resData.current = curPage;
        resData.totalPages = totalPages;
        resData.total = totalCount;
        if (totalPages >= curPage) {
            resData.data = await this.collectionsSvr.list(uid, query);
        }
        return resData;
    }

    @Roles("admin", "token")
    @Get("/collections")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Self Collection List" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Self Collection List",
        type: ListResponse
    })
    // endregion Swagger Docs
    public getSelfCollections(
        @Session() session, @Query(new ParseIntPipe()) query: PerPageDto
    ) {
        const userId: ObjectId = session.loginUserId;
        return this.getCollectionsRes(userId, query);
    }

    @Roles("admin")
    @Get("/:uid/collections")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get User's Collection List" })
    @ApiResponse({
        status: HttpStatus.OK, description: "User's Collection List",
        type: ListResponse
    })
    // endregion Swagger Docs
    public async getCollections(
        @Param() param: UidDto, @Query(new ParseIntPipe()) query: PerPageDto
    ) {
        const userId: ObjectId = param.uid;
        return this.getCollectionsRes(userId, query);
    }

    ////////////////////////////////////////
    // endregion Collection Methods
    ////////////////////////////////////////

    ////////////////////////////////////////
    // region Usergroup Methods
    ////////////////////////////////////////

    @Roles("admin")
    @Get("/:uid/usergroup/:gid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Move Usergroup" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Move Success",
    })
    // endregion Swagger Docs
    public async moveUsergroup(@Param() param: UserUsergroupParamDto) {
        const group = await this.usersSvr.getUsergroup(param.uid);
        if (group) {
            const gid = group._id;
            if (gid.toString() === param.gid) {
                throw new BadRequestException("This is old Usergroup ID");
            }
            await this.ugSvr.moveUser(param.gid, param.uid);
        } else {
            await this.ugSvr.addUserToGroup(param.gid, param.uid);
        }
        return new DefResDto();
    }

    ////////////////////////////////////////
    // endregion Usergroup Methods
    ////////////////////////////////////////

    @Roles("admin")
    @Get("/:uid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get User Info" })
    @ApiResponse({ status: HttpStatus.OK, description: "Get User Info" })
    // endregion Swagger Docs
    public get(@Param() param: UidDto) {
        return UserModel.findById(param.uid).exec();
    }

}
