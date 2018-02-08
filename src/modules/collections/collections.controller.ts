import {
    ApiBearerAuth, ApiUseTags, ApiOperation, ApiResponse
} from "@nestjs/swagger";
import {
    Controller, UseGuards, Get, HttpCode, HttpStatus, Session, Query, Post,
    Body, Param, Delete
} from "@nestjs/common";
import { CollectionDoc } from "@models/Collection";
import { ObjectId } from "@models/common";
import { RolesGuard } from "@guards/roles";
import { CollectionsService } from "@services/collections";
import { Roles } from "@decorators/roles";
import { ParseIntPipe } from "@pipes/parse-int";
import { PerPageDto, DEF_PER_COUNT, ListResponse } from "@dtos/page";
import { CCidDto } from "@dtos/ids";
import {
    CreateCollectionDto, EditCollectionDto, ICollection, IEditCollection
} from "./collections.dto";

@UseGuards(RolesGuard)
@Controller("api/v1/collections")
// region Swagger Docs
@ApiUseTags("collections")
@ApiBearerAuth()
// endregion Swagger Docs
export class CollectionsAdminController {

    constructor(private readonly collectionsSvr: CollectionsService) { }

    private async getCollectionsRes(uid: ObjectId, query: PerPageDto) {
        const curPage = query.page || 1;
        const perNum = query.perNum || DEF_PER_COUNT;
        const totalPages =
            await this.collectionsSvr.countPage(uid, query.perNum);
        const totalCount = await this.collectionsSvr.count(uid);

        const resData = new ListResponse<CollectionDoc>();
        resData.current = curPage;
        resData.totalPages = totalPages;
        resData.total = totalCount;
        if (totalPages >= curPage) {
            resData.data = await this.collectionsSvr.list(uid, {
                page: curPage, perNum
            });
        }
        return resData;
    }

    @Roles("admin")
    @Get()
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Self Collection List" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Self Collection List",
        type: ListResponse
    })
    // endregion Swagger Docs
    public getSelfCollections(
        @Session() session, @Query(new ParseIntPipe()) query: PerPageDto
    ) {
        const userId: ObjectId = session.loginUserId;
        return this.getCollectionsRes(userId, query);
    }

    @Roles("admin")
    @Post()
    // region Swagger Docs
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ title: "Create Collection" })
    // endregion Swagger Docs
    public addCollection(
        @Session() session, @Body() body: CreateCollectionDto
    ) {
        const obj: ICollection = {
            goods: body.goods,
            creator: session.loginUserId
        };
        if (body.name) {
            obj.name = body.name;
        }
        return this.collectionsSvr.create(obj);
    }

    @Roles("admin")
    @Post("/:cid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Edit Collection" })
    // endregion Swagger Docs
    public editCollection(
        @Param() param: CCidDto, @Body() body: EditCollectionDto
    ) {
        const obj: IEditCollection = { };
        if (body.name) {
            obj.name = body.name;
        }
        if (body.goods) {
            obj.goods = body.goods;
        }
        return this.collectionsSvr.edit(param.cid, obj);
    }

    @Roles("admin")
    @Get("/:cid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get One Collection's Info" })
    // endregion Swagger Docs
    public getCollection(@Param() param: CCidDto) {
        return this.collectionsSvr.getById(param.cid);
    }

    /////////////////////////
    // region Delete Method
    /////////////////////////

    private async delete(id: ObjectId) {
        await this.collectionsSvr.remove(id);
        return { statusCode: HttpStatus.OK };
    }

    @Roles("admin")
    @Get("/:cid/delete")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete Collection" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete Collection Success"
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST, description: "Delete Collection Fail"
    })
    // endregion Swagger Docs
    public deleteByGet(@Param() param: CCidDto) {
        return this.delete(param.cid);
    }

    @Roles("admin")
    @Delete("/:cid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete Collection" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete Collection Success"
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST, description: "Delete Collection Fail"
    })
    // endregion Swagger Docs
    public deleteByDelete(@Param() param: CCidDto) {
        return this.delete(param.cid);
    }

    /////////////////////////
    // endregion Delete Method
    /////////////////////////

}
