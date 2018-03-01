import { UseGuards, Controller, Get, Query, HttpStatus, HttpCode, Post, Body, Param, Delete } from "@nestjs/common";
import { ApiUseTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { RolesGuard } from "@guards/roles";
import { UsergroupsService } from "@services/usergroups";
import { Roles } from "@decorators/roles";
import { ParseIntPipe } from "@pipes/parse-int";
import { PerPageDto, ListResponse, DEF_PER_COUNT } from "@dtos/page";
import { UGidDto } from "@dtos/ids";

import { AddUsergroupDto, EditUsergroupDto } from "./usergroups.dto";

@UseGuards(RolesGuard)
@ApiUseTags("User Groups")
@Controller("api/v1/usergroups")
export class UsergroupsAdminController {

    constructor(private readonly ugSvr: UsergroupsService) { }

    @Roles("admin")
    @Get()
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Usergroup List" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Usergroup List",
        type: ListResponse
    })
    // endregion Swagger Docs
    public async getList(@Query(new ParseIntPipe()) query: PerPageDto) {
        const curPage = query.page || 1;
        const perNum = query.perNum || DEF_PER_COUNT;
        const resData = new ListResponse();
        resData.current = curPage;
        resData.totalPages = await this.ugSvr.countPage(perNum);
        resData.total = await this.ugSvr.count();
        if (resData.totalPages >= resData.current) {
            resData.data = await this.ugSvr.list({
                page: curPage, perNum
            });
        }
        return resData;
    }

    @Roles("admin")
    @Post()
    // region Swagger Docs
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ title: "New Usergroup" })
    @ApiResponse({
        status: HttpStatus.CREATED, description: "Success"
    })
    // endregion Swagger Docs
    public addUsergroup(@Body() body: AddUsergroupDto) {
        return this.ugSvr.add(body);
    }

    @Roles("admin")
    @Get("/:gid/delete")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete Usergroup" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete Success"
    })
    // endregion Swagger Docs
    public async removeUsergroupByGet(@Param() param: UGidDto) {
        return this.ugSvr.remove(param.gid);
    }

    @Roles("admin")
    @Delete("/:gid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete Usergroup" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete Success"
    })
    // endregion Swagger Docs
    public async removeUsergroupByDelete(@Param() param: UGidDto) {
        return this.ugSvr.remove(param.gid);
    }

    @Roles("admin")
    @Post("/:gid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Modify Usergroup Info" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Modify Success"
    })
    // endregion Swagger Docs
    public async editUsergroup(
        @Param() param: UGidDto, @Body() body: EditUsergroupDto
    ) {
        return this.ugSvr.edit(param.gid, body);
    }

    @Roles("admin")
    @Get("/:gid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Usergroup Info" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Usergroup Info"
    })
    // endregion Swagger Docs
    public async getUsergroup(
        @Param() param: UGidDto, @Query(new ParseIntPipe()) query: PerPageDto
    ) {
        let group: any = await this.ugSvr.getGroup(param.gid);
        if (!group) {
            return group;
        }
        group = group.toObject();
        const users = new ListResponse();
        const curPage = query.page || 1;
        const perNum = query.perNum || DEF_PER_COUNT;
        users.current = curPage;
        users.totalPages = await this.ugSvr.usersCountPage(param.gid, perNum);
        users.total = await this.ugSvr.usersCount(param.gid);
        if (users.totalPages >= users.current) {
            users.data = await this.ugSvr.getGroupUsers(param.gid, {
                page: curPage, perNum
            });
        }
        group.users = users;
        return group;
    }

}
