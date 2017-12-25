import {
    Controller, Post, Res, Body, Get, HttpStatus, HttpCode
} from "@nestjs/common";
import { Model as RegexpModel } from "@models/Regexp";
import { NewRegexp, EditRegexpDot, CommonRegexpDot } from "./regexps.dto";

@Controller("regexps")
export class RegexpsController {

    @HttpCode(HttpStatus.OK)
    @Get()
    public async list() {
        return await RegexpModel.list();
    }

    @Post()
    public async add(@Res() res, @Body() ctx: NewRegexp) {
        try {
            await RegexpModel.addRegexp(ctx.name, ctx.value);
        } catch (error) {
            res.status(HttpStatus.BAD_REQUEST).send(error.toString());
            return;
        }
        res.status(HttpStatus.CREATED).json({ });
    }

    @Post("/:id")
    public async edit(@Res() res, @Body() ctx: EditRegexpDot) {
        try {
            await RegexpModel.findByIdAndUpdate(ctx.id, {
                name: ctx.name, value: ctx.value
            }).exec();
        } catch (error) {
            res.status(HttpStatus.BAD_REQUEST).send(error.toString());
            return;
        }
        res.status(HttpStatus.OK).json({ });
    }

    @Post("/:id/delete")
    public async delete(@Res() res, @Body() ctx: CommonRegexpDot) {
        try {
            await RegexpModel.removeRegexp(ctx.id);
        } catch (error) {
            res.status(HttpStatus.BAD_REQUEST).send(error.toString());
            return;
        }
        res.status(HttpStatus.OK).json({ });
    }

}
