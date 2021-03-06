import {
    Controller, Get, Post, Body, Res, HttpStatus, Req, BadRequestException,
    Param, UseGuards, Query, Delete, HttpCode, Session, ForbiddenException
} from "@nestjs/common";
import {
    ApiBearerAuth, ApiUseTags, ApiResponse, ApiOperation, ApiImplicitParam
} from "@nestjs/swagger";
import { ObjectId } from "@models/common";
import { Roles } from "@decorators/roles";
import { RolesGuard } from "@guards/roles";
import { ParseIntPipe } from "@pipes/parse-int";
import { TokensService } from "@services/tokens";
import { UsergroupsService } from "@services/usergroups";
import { CollectionsService } from "@services/collections";
import { UsersService } from "@services/users";
import { SystemService } from "@services/system";
import { UtilService } from "@services/util";
import { GoodsService } from "@services/goods";
import { PerPageDto, ListResponse, DEF_PER_COUNT } from "@dtos/page";
import { UidDto } from "@dtos/ids";
import { DefResDto } from "@dtos/res";

import {
    CreateUserDto, ModifyPasswordDto, EditUserDto, UsergroupBodyDto
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
        private readonly ugSvr: UsergroupsService,
        private readonly sysSvr: SystemService,
        private readonly goodsSvr: GoodsService
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
        const arr = await this.usersSvr.list(query);
        return UtilService.toListRespone(arr, Object.assign({
            total: await this.usersSvr.conut()
        }, query));
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
    public addUser(@Body() user: CreateUserDto) {
        return this.usersSvr.addUser(user);
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
        await this.usersSvr.passwd(
            param.uid, user.oldPassword, user.newPassword
        );
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
    public delete(@Param() user: UidDto) {
        this.usersSvr.removeUser(user.uid);
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
        const arr = await this.tokensSvr.getTokens(session.loginUserId);
        return UtilService.toListRespone(arr);
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
        const arr = await this.tokensSvr.getTokens(param.uid);
        return UtilService.toListRespone(arr);
    }

    ////////////////////////////////////////
    // endregion Token Methods
    ////////////////////////////////////////

    ////////////////////////////////////////
    // region Good Methods
    ////////////////////////////////////////

    private async getGoodsRes(uid: ObjectId, query: PerPageDto) {
        const arr = await this.goodsSvr.getByUids(uid, query);
        return UtilService.toListRespone(arr, Object.assign({
            total: await this.goodsSvr.countByUids(uid)
        }, query));
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
        const arr = await this.collectionsSvr.list(uid, query);
        return UtilService.toListRespone(arr, {
            total: await this.collectionsSvr.count(uid)
        });
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
    @Get("/:uid/usergroups")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Usergroup" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Usergroup List", type: ListResponse
    })
    // endregion Swagger Docs
    public async getUsergroups(
        @Param() param: UidDto, @Query(new ParseIntPipe()) query: PerPageDto
    ) {
        const arr = await this.usersSvr.getUsergroups(param.uid, query);
        return UtilService.toListRespone(arr, Object.assign({
            total: await this.usersSvr.countUsergroups(param.uid)
        }, query));
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
        return this.usersSvr.getById(param.uid);
    }

}
