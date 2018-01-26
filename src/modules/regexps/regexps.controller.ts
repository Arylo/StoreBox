import {
    Controller, Post, Res, Body, Get, HttpStatus, HttpCode, BadRequestException,
    Param, Delete, UseGuards, Query
} from "@nestjs/common";
import {
    ApiBearerAuth, ApiUseTags, ApiResponse, ApiOperation, ApiImplicitParam
} from "@nestjs/swagger";
import { Model as RegexpsModel, IRegexp, RegexpDoc } from "@models/Regexp";
import {
    NewRegexp, EditRegexpDot, CommonRegexpDot, EditRegexpRawDot
} from "./regexps.dto";
import { Roles } from "@decorators/roles";
import { RolesGuard } from "@guards/roles";
import { PerPageDto, ListResponse } from "@dtos/page";
import { RidDto } from "@dtos/ids";
import { ParseIntPipe } from "@pipes/parse-int";

@UseGuards(RolesGuard)
@Controller("api/v1/regexps")
// region Swagger Docs
@ApiUseTags("regexps")
@ApiBearerAuth()
// endregion Swagger Docs
export class RegexpsAdminController {

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
        const curPage = query.page || 1;
        const totalPage = await RegexpsModel.pageCount(query.perNum);
        const data = new ListResponse<IRegexp | RegexpDoc>();
        data.current = curPage;
        data.total = totalPage;
        if (totalPage >= curPage) {
            data.data = await RegexpsModel.list(query.perNum, query.page);
        }
        return data;
    }

    @Roles("admin")
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ title: "Add RegExp" })
    public async add(@Body() ctx: NewRegexp) {
        let regexp;
        try {
            regexp = await RegexpsModel.addRegexp(ctx.name, ctx.value);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        return regexp;
    }

    @Roles("admin")
    @Get("/:rid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get RegExp Info" })
    // endregion Swagger Docs
    public getRegexp(@Param() param: RidDto) {
        return RegexpsModel.findById(param.rid)
            .populate({ path: "link", populate: { path: "pid" } })
            .exec();
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
        if (Object.keys(data).length === 0) {
            throw new BadRequestException("No Params");
        }
        try {
            const regexp = await RegexpsModel.findByIdAndUpdate(
                param.rid, data, { runValidators: true }
            ).exec();
            if (!regexp) {
                throw new BadRequestException("NonExist RegExp");
            }
        } catch (error) {
            throw new BadRequestException(error.toString());
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
        try {
            await RegexpsModel.removeRegexp(param.rid);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        return { statusCode: HttpStatus.OK };
    }

}
