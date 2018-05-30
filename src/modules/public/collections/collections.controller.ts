import { Roles } from "@decorators/roles";
import { GetCollectionNameDto } from "@dtos/collections";
import { PerPageDto } from "@dtos/page";
import { RolesGuard } from "@guards/roles";
import {
    Controller, Get, HttpCode, HttpStatus, Param, Query, UseGuards
} from "@nestjs/common";
import { ApiOperation, ApiUseTags } from "@nestjs/swagger";
import { ParseIntPipe } from "@pipes/parse-int";
import { CollectionsService } from "@services/collections";
import { LogsService } from "@services/logs";
import { UtilService } from "@services/util";

@UseGuards(RolesGuard)
@Controller("/collections")
// region Swagger Docs
@ApiUseTags("Good Download")
// endregion Swagger Docs
export class CollectionsController {

    constructor(
        private readonly collectionsSvr: CollectionsService,
        private readonly logsSvr: LogsService
    ) { }

    @Roles("guest")
    @Get("/:name")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Collection Info" })
    // endregion Swagger Docs
    public async getCollection(
        @Param() param: GetCollectionNameDto,
        @Query(new ParseIntPipe()) query: PerPageDto
    ) {
        const doc = await this.collectionsSvr.getObjectByName(param.name);
        if (!doc) {
            return null;
        }
        const obj = doc;
        // obj = doc.toObject();
        obj.creator = obj.creator.nickname as any;
        const goods = [ ];
        for (const good of obj.goods) {
            const keys = [
                "__v", "uploader", "hidden"
            ];
            for (const key of keys) {
                delete good[key];
            }
            good.downloaded = await this.logsSvr.goodDownloadCount(good._id);
            goods.push(good);
        }
        obj.goods = UtilService.toListRespone(goods, {
            perNum: goods.length
        }) as any;
        return obj;
    }

}
