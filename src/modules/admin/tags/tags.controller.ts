import { Roles } from "@decorators/roles";
import { CCidDto } from "@dtos/ids";
import { ListResponse, PerPageDto } from "@dtos/page";
import { DefResDto } from "@dtos/res";
import { AddDto, EditDto, TidDto } from "@dtos/tags";
import { RolesGuard } from "@guards/roles";
import {
    Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards
} from "@nestjs/common";
import {
    ApiBearerAuth, ApiOperation, ApiResponse, ApiUseTags
} from "@nestjs/swagger";
import { ParseIntPipe } from "@pipes/parse-int";
import { ToArrayPipe } from "@pipes/to-array";
import { CategoriesService } from "@services/categories";
import { TagsService } from "@services/tags";
import { UtilService } from "@services/util";

@UseGuards(RolesGuard)
@Controller("api/v1/tags")
// region Swagger Docs
@ApiUseTags("Tags")
@ApiBearerAuth()
// endregion Swagger Docs
export class TagsAdminController {

    constructor(
        private readonly categoriesSvr: CategoriesService,
        private readonly tagsSvr: TagsService
    ) { }

    @Roles("admin")
    @Post()
    // region Swagger Docs
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ title: "Add Tag Group" })
    @ApiResponse({ status: HttpStatus.CREATED, type: DefResDto })
    // endregion Swagger Docs
    public add(@Body(new ToArrayPipe("tags")) body: AddDto) {
        return this.tagsSvr.create(body);
    }

    @Roles("admin")
    @Put("/:tid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Modify Tag Group By ID" })
    // endregion Swagger Docs
    public async modify(
        @Param() param: TidDto, @Body(new ToArrayPipe("tags")) body: EditDto
    ) {
        await this.tagsSvr.modifyById(param.tid, body);
        return new DefResDto();
    }

    @Roles("admin")
    @Delete("/:tid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete Tag Group By ID" })
    // endregion Swagger Docs
    public async delete(@Param() param: TidDto) {
        return this.tagsSvr.deleteById(param.tid);
    }

    @Roles("admin")
    @Get("cloud")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Tag Cloud" })
    @ApiResponse({ status: HttpStatus.OK, type: ListResponse })
    // endregion Swagger Docs
    public async tagCloud() {
        const tags = await this.categoriesSvr.getTags();
        return UtilService.toListRespone(tags, { perNum: tags.length });
    }

    @Roles("admin")
    @Get()
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Tag Group List" })
    @ApiResponse({ status: HttpStatus.OK, type: ListResponse })
    // endregion Swagger Docs
    public async list(@Query(new ParseIntPipe()) query: PerPageDto) {
        const arr = await this.tagsSvr.list({ }, query);
        return UtilService.toListRespone(arr, query);
    }

    @Roles("admin")
    @Get("/:tid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Tag Group Info" })
    // endregion Swagger Docs
    public async get(@Param() param: TidDto) {
        return this.tagsSvr.findById(param.tid);
    }

}
