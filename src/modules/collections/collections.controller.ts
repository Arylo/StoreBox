import {
    UseGuards, Controller, Get, HttpCode, HttpStatus, Param
} from "@nestjs/common";
import { ApiUseTags, ApiOperation } from "@nestjs/swagger";
import { CollectionsService } from "@services/collections";
import { RolesGuard } from "@guards/roles";
import { Roles } from "@decorators/roles";
import { GetCollectionNameDto } from "./collections.dto";

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
    public async getCollection(@Param() query: GetCollectionNameDto) {
        const colDoc = await this.collectionsSvr.getByName(query.name);
        let col;
        col = colDoc.toObject();
        col.creator = col.creator.nickname;
        col.goods.map((good) => {
            const keys = [
                "__v", "uploader", "hidden"
            ];
            for (const key of keys) {
                delete good[key];
            }
            return good;
        });
        return col;
    }

}
