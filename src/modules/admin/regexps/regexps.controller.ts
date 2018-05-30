import { Roles } from "@decorators/roles";
import { RidDto } from "@dtos/ids";
import { ListResponse, PerPageDto } from "@dtos/page";
import { DefResDto } from "@dtos/res";
import { RolesGuard } from "@guards/roles";
import { RegexpDoc } from "@models/Regexp";
import {
    BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param,
    Post, Query, Res, UseGuards
} from "@nestjs/common";
import {
    ApiBearerAuth, ApiImplicitParam, ApiOperation, ApiResponse, ApiUseTags
} from "@nestjs/swagger";
import { ParseIntPipe } from "@pipes/parse-int";
import { RegexpsService } from "@services/regexps";
import { UtilService } from "@services/util";
import { EditRegexpDot, NewRegexp } from "./regexps.dto";

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
    public add(@Body() ctx: NewRegexp) {
        return this.regexpsSvr.create(ctx);
    }

    @Roles("admin")
    @Get("/:rid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get RegExp Info" })
    // endregion Swagger Docs
    public getRegexp(@Param() param: RidDto) {
        return this.regexpsSvr.getById(param.rid);
    }

    @Roles("admin")
    @Post("/:rid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Edit RegExp" })
    // endregion Swagger Docs
    public async edit(@Body() ctx: EditRegexpDot, @Param() param: RidDto) {
        const regexp = await this.regexpsSvr.editById(param.rid, ctx);
        if (!regexp) {
            throw new BadRequestException("Non Exist RegExp");
        }
        return new DefResDto();
    }

    @Roles("admin")
    @Delete("/:rid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete RegExp" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete RegExp Success",
        type: DefResDto
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
        status: HttpStatus.OK, description: "Delete RegExp Success",
        type: DefResDto
    })
    // endregion Swagger Docs
    public async deleteByGet(@Param() param: RidDto) {
        await this.regexpsSvr.remove(param.rid);
        return new DefResDto();
    }

}
