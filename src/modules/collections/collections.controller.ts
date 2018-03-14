import {
    UseGuards, Controller, Get, HttpCode, HttpStatus, Param, Query
} from "@nestjs/common";
import { ApiUseTags, ApiOperation } from "@nestjs/swagger";
import { CollectionsService } from "@services/collections";
import { UtilService } from "@services/util";
import { RolesGuard } from "@guards/roles";
import { Roles } from "@decorators/roles";
import { GetCollectionNameDto } from "./collections.dto";
import { PerPageDto } from "@dtos/page";
import { ParseIntPipe } from "@pipes/parse-int";

@UseGuards(RolesGuard)
@Controller("/collections")
// region Swagger Docs
@ApiUseTags("Good Download")
// endregion Swagger Docs
export class CollectionsController {

    constructor(private readonly collectionsSvr: CollectionsService) { }

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
        const doc = await this.collectionsSvr.getByName(param.name);
        if (!doc) {
            return null;
        }
        let obj;
        obj = doc.toObject();
        obj.creator = obj.creator.nickname;
        obj.goods.map((good) => {
            const keys = [
                "__v", "uploader", "hidden"
            ];
            for (const key of keys) {
                delete good[key];
            }
            return good;
        });
        obj.goods = UtilService.toListRespone(obj.goods, {
            perNum: obj.goods.length
        });
        return obj;
    }

}
