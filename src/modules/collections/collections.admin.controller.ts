import {
    ApiBearerAuth, ApiUseTags, ApiOperation, ApiResponse
} from "@nestjs/swagger";
import {
    Controller, UseGuards, Get, HttpCode, HttpStatus, Session, Query, Post,
    Body, Param, Delete, BadRequestException
} from "@nestjs/common";
import { CollectionDoc } from "@models/Collection";
import { ObjectId } from "@models/common";
import { RolesGuard } from "@guards/roles";
import { CollectionsService } from "@services/collections";
import { UtilService } from "@services/util";
import { Roles } from "@decorators/roles";
import { ParseIntPipe } from "@pipes/parse-int";
import { PerPageDto, DEF_PER_COUNT, ListResponse } from "@dtos/page";
import { CCidDto } from "@dtos/ids";
import { DefResDto } from "@dtos/res";
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
        const arr = await this.collectionsSvr.list(uid, {
            page: query.page, perNum: query.perNum
        });
        const opts = Object.assign({
            total: await this.collectionsSvr.count(uid)
        }, query);
        return UtilService.toListRespone(arr, opts);
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
    public async editCollection(
        @Param() param: CCidDto, @Body() body: EditCollectionDto
    ) {
        const obj: IEditCollection = { };
        if (body.name) {
            obj.name = body.name;
        }
        if (body.goods) {
            obj.goods = body.goods;
        }
        await this.collectionsSvr.edit(param.cid, obj);
        return new DefResDto();
    }

    @Roles("admin")
    @Get("/:cid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get One Collection's Info" })
    // endregion Swagger Docs
    public async getCollection(@Param() param: CCidDto) {
        const doc = await this.collectionsSvr.getById(param.cid);
        if (!doc) {
            return null;
        }
        const obj = doc.toObject();
        obj.goods = UtilService.toListRespone(obj.goods as any[], {
            perNum: obj.goods.length
        }) as any;
        return obj;
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
