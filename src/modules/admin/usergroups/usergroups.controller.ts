import {
    UseGuards, Controller, Get, Query, HttpStatus, HttpCode, Post, Body, Param,
    Delete
} from "@nestjs/common";
import { ApiUseTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { RolesGuard } from "@guards/roles";
import { UsergroupsService } from "@services/usergroups";
import { Roles } from "@decorators/roles";
import { ParseIntPipe } from "@pipes/parse-int";
import { PerPageDto, ListResponse, DEF_PER_COUNT } from "@dtos/page";
import { UGidDto } from "@dtos/ids";
import { UtilService } from "@services/util";

import {
    AddUsergroupDto, EditUsergroupDto, UserUsergroupDto
} from "./usergroups.dto";

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
        const arr = await this.ugSvr.list(query);
        return UtilService.toListRespone(arr, Object.assign({
            total: await this.ugSvr.count()
        }, query));
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
        const arr = await this.ugSvr.getGroupUsers(param.gid, query);
        group.users = UtilService.toListRespone(arr, Object.assign({
            total: await this.ugSvr.usersCount(param.gid)
        }, query));
        return group;
    }

    @Roles("admin")
    @Get("/:gid/add/:uid")
    // region Swagger Docs
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ title: "Add User to Usergroup" })
    @ApiResponse({
        status: HttpStatus.CREATED, description: "Add Success"
    })
    // endregion Swagger Docs
    public addUser(@Param() param: UserUsergroupDto) {
        return this.ugSvr.addUserToGroup(param.gid, param.uid);
    }

    @Roles("admin")
    @Get("/:gid/remove/:uid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Remove User from Usergroup" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Remove Success"
    })
    // endregion Swagger Docs
    public removeUser(@Param() param: UserUsergroupDto) {
        return this.ugSvr.removeUserFromGroup(param.gid, param.uid);
    }

}
