import {
    Controller, Post, Res, Body, Get, HttpStatus, HttpCode, BadRequestException, Param
} from "@nestjs/common";
import { Model as RegexpModel } from "@models/Regexp";
import { NewRegexp, EditRegexpDot, CommonRegexpDot } from "./regexps.dto";
import { ApiBearerAuth, ApiUseTags, ApiResponse, ApiOperation, ApiImplicitParam } from "@nestjs/swagger";

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
        return await RegexpModel.list();
    }

    @Post()
    @ApiOperation({ title: "Add RegExp" })
    public async add(@Res() res, @Body() ctx: NewRegexp) {
        try {
            await RegexpModel.addRegexp(ctx.name, ctx.value);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        res.status(HttpStatus.CREATED).json({ });
    }

    @Post("/:id")
    @ApiOperation({ title: "Edit RegExp" })
    @ApiImplicitParam({ name: "id", description: "RegExp ID" })
    public async edit(@Res() res, @Body() ctx: EditRegexpDot, @Param("id") id) {
        try {
            await RegexpModel.findByIdAndUpdate(id, {
                name: ctx.name, value: ctx.value
            }).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        res.status(HttpStatus.OK).json({ });
    }

    @Get("/:id/delete")
    @ApiOperation({ title: "Delete RegExp" })
    @ApiImplicitParam({ name: "id", description: "RegExp ID" })
    public async delete(@Res() res, @Param("id") id) {
        try {
            await RegexpModel.removeRegexp(id);
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        res.status(HttpStatus.OK).json({ });
    }

}
