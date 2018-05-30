import { Roles } from "@decorators/roles";
import { ListResponse, PerPageDto } from "@dtos/page";
import { RolesGuard } from "@guards/roles";
import {
    Controller, Get, HttpCode, HttpStatus, Query, UseGuards
} from "@nestjs/common";
import {
    ApiBearerAuth, ApiOperation, ApiResponse, ApiUseTags
} from "@nestjs/swagger";
import { ParseIntPipe } from "@pipes/parse-int";
import { ToArrayPipe } from "@pipes/to-array";
import { TagsService } from "@services/tags";
import { UtilService } from "@services/util";

@UseGuards(RolesGuard)
@Controller("tags")
// region Swagger Docs
@ApiUseTags("Good Download")
// endregion Swagger Docs
export class TagsController {

    constructor(
        private readonly tagsSvr: TagsService
    ) { }

    @Roles("guest")
    @Get()
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Tag Group List" })
    @ApiResponse({ status: HttpStatus.OK, type: ListResponse })
    // endregion Swagger Docs
    public async list(@Query(new ParseIntPipe()) query: PerPageDto) {
        const cond = { hidden: false };
        const arr = await this.tagsSvr.list(cond, Object.assign({ }, {
            select: "-_id name tags"
        }, query));
        const options = Object.assign({ }, {
            total: await this.tagsSvr.total(cond)
        }, query);
        return UtilService.toListRespone(arr, options);
    }

}
