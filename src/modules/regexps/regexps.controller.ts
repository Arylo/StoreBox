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
import { PerPageDto, ListResponse } from "../common/dtos/page.dto";
import { ParseIntPipe } from "@pipes/parse-int";

@UseGuards(RolesGuard)
@Controller("api/v1/regexps")
// region Swagger Docs
@ApiUseTags("regexps")
@ApiBearerAuth()
// endregion Swagger Docs
export class RegexpsController {

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
    @ApiOperation({ title: "Add RegExp" })
    public async add(@Res() res, @Body() ctx: NewRegexp) {
        let regexp;
        try {
            regexp = await RegexpsModel.addRegexp(ctx.name, ctx.value);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        res.status(HttpStatus.CREATED).json(regexp);
    }

    @Roles("admin")
    @Post("/:id")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Edit RegExp" })
    @ApiImplicitParam({ name: "id", description: "RegExp ID" })
    // endregion Swagger Docs
    public async edit(@Body() ctx: EditRegexpDot, @Param("id") id) {
        const data: EditRegexpRawDot = { };
        if (ctx.name) { data.name = ctx.name; }
        if (ctx.value) { data.value = ctx.value; }
        if (ctx.link) { data.link = ctx.link; }
        if (Object.keys(data).length === 0) {
            throw new BadRequestException("No Params");
        }
        try {
            const regexp = await RegexpsModel.findByIdAndUpdate(
                id, data, { runValidators: true }
            ).exec();
            if (!regexp) {
                throw new BadRequestException("NonExist RegExp");
            }
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        return { };
    }

    @Roles("admin")
    @Delete("/:id")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete RegExp" })
    @ApiImplicitParam({ name: "id", description: "RegExp ID" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete RegExp Success"
    })
    // endregion Swagger Docs
    public deleteByDelete(@Param("id") id) {
        return this.deleteByGet(id);
    }

    @Roles("admin")
    @Get("/:id/delete")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete RegExp" })
    @ApiImplicitParam({ name: "id", description: "RegExp ID" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete RegExp Success"
    })
    // endregion Swagger Docs
    public async deleteByGet(@Param("id") id) {
        try {
            await RegexpsModel.removeRegexp(id);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        return { };
    }

}
