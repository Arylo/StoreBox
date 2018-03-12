import {
    Controller, Post, Res, Body, Get, HttpStatus, HttpCode, BadRequestException,
    Param, Delete, UseGuards, Query
} from "@nestjs/common";
import {
    ApiBearerAuth, ApiUseTags, ApiResponse, ApiOperation, ApiImplicitParam
} from "@nestjs/swagger";
import { RegexpDoc } from "@models/Regexp";
import {
    NewRegexp, EditRegexpDot, EditRegexpRawDot
} from "./regexps.dto";
import { Roles } from "@decorators/roles";
import { RolesGuard } from "@guards/roles";
import { PerPageDto, ListResponse } from "@dtos/page";
import { RidDto } from "@dtos/ids";
import { ParseIntPipe } from "@pipes/parse-int";
import { RegexpsService } from "@services/regexps";
import { UtilService } from "@services/util";

@UseGuards(RolesGuard)
@Controller("api/v1/regexps")
// region Swagger Docs
@ApiUseTags("regexps")
@ApiBearerAuth()
// endregion Swagger Docs
export class RegexpsAdminController {

    constructor(
        private readonly regexpsSvr: RegexpsService
    ) { }

    @Roles("admin")
    @Get()
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get RegExp List" })
    @ApiResponse({
        status: HttpStatus.OK, description: "RegExp List",
        type: ListResponse
    })
    // endregion Swagger Docs
    public async list(@Query(new ParseIntPipe()) query: PerPageDto) {
        const arr = await this.regexpsSvr.list(query.perNum, query.page);
        return UtilService.toListRespone(arr, Object.assign({
            total: await this.regexpsSvr.count()
        }, query));
    }

    @Roles("admin")
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ title: "Add RegExp" })
    public async add(@Body() ctx: NewRegexp) {
        return await this.regexpsSvr.create(ctx);
    }

    @Roles("admin")
    @Get("/:rid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get RegExp Info" })
    // endregion Swagger Docs
    public getRegexp(@Param() param: RidDto) {
        return this.regexpsSvr.getRegexp(param.rid);
    }

    @Roles("admin")
    @Post("/:rid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Edit RegExp" })
    // endregion Swagger Docs
    public async edit(@Body() ctx: EditRegexpDot, @Param() param: RidDto) {
        const data: EditRegexpRawDot = { };
        if (ctx.name) { data.name = ctx.name; }
        if (ctx.value) { data.value = ctx.value; }
        if (ctx.link) { data.link = ctx.link; }
        if (ctx.hidden !== null && ctx.hidden !== undefined) {
            data.hidden = ctx.hidden;
        }
        if (Object.keys(data).length === 0) {
            throw new BadRequestException("No Params");
        }
        const regexp = await this.regexpsSvr.editById(param.rid, data);
        if (!regexp) {
            throw new BadRequestException("NonExist RegExp");
        }
        return { statusCode: HttpStatus.OK };
    }

    @Roles("admin")
    @Delete("/:rid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete RegExp" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete RegExp Success"
    })
    // endregion Swagger Docs
    public deleteByDelete(@Param() param: RidDto) {
        return this.deleteByGet(param);
    }

    @Roles("admin")
    @Get("/:rid/delete")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete RegExp" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete RegExp Success"
    })
    // endregion Swagger Docs
    public async deleteByGet(@Param() param: RidDto) {
        await this.regexpsSvr.remove(param.rid);
        return { statusCode: HttpStatus.OK };
    }

}
