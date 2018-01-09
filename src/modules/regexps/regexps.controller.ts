import {
    Controller, Post, Res, Body, Get, HttpStatus, HttpCode, BadRequestException,
    Param, Delete
} from "@nestjs/common";
import { Model as RegexpsModel } from "@models/Regexp";
import {
    NewRegexp, EditRegexpDot, CommonRegexpDot, EditRegexpRawDot
} from "./regexps.dto";
import {
    ApiBearerAuth, ApiUseTags, ApiResponse, ApiOperation, ApiImplicitParam
} from "@nestjs/swagger";

@Controller("api/v1/regexps")
@ApiUseTags("regexps")
@ApiBearerAuth()
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
export class RegexpsController {

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get RegExp List" })
    @ApiResponse({ status: HttpStatus.OK, description: "RegExp List" })
    public async list() {
        return await RegexpsModel.list();
    }

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

    @Post("/:id")
    @ApiOperation({ title: "Edit RegExp" })
    @ApiImplicitParam({ name: "id", description: "RegExp ID" })
    public async edit(@Res() res, @Body() ctx: EditRegexpDot, @Param("id") id) {
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
        res.status(HttpStatus.OK).json({ });
    }

    @Delete("/:id")
    @ApiOperation({ title: "Delete RegExp" })
    @ApiImplicitParam({ name: "id", description: "RegExp ID" })
    public async deleteByDelete(@Res() res, @Param("id") id) {
        return this.deleteByGet(res, id);
    }

    @Get("/:id/delete")
    @ApiOperation({ title: "Delete RegExp" })
    @ApiImplicitParam({ name: "id", description: "RegExp ID" })
    public async deleteByGet(@Res() res, @Param("id") id) {
        try {
            await RegexpsModel.removeRegexp(id);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        res.status(HttpStatus.OK).json({ });
    }

}
