import { Roles } from "@decorators/roles";
import { DEF_PER_COUNT, ListResponse } from "@dtos/page";
import { RolesGuard } from "@guards/roles";
import { IGoodsRaw } from "@models/Good";
import { IUser } from "@models/User";
import {
    Controller, Get, HttpCode, HttpStatus, Query, UseGuards
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiUseTags } from "@nestjs/swagger";
import { ParseIntPipe } from "@pipes/parse-int";
import { ToArrayPipe } from "@pipes/to-array";
import { CategoriesService } from "@services/categories";
import { GoodsService } from "@services/goods";
import { LogsService } from "@services/logs";
import { UtilService } from "@services/util";
import { reduce } from "lodash";

import { GoodsQueryDto } from "./goods.dto";

@UseGuards(RolesGuard)
@Controller("goods")
@ApiUseTags("Good Download")
export class GoodsController {

    constructor(
        private readonly goodsSvr: GoodsService,
        private readonly categoriesSvr: CategoriesService,
        private readonly logsSvr: LogsService
    ) { }

    @Roles("guest")
    @Get()
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Good List" })
    @ApiResponse({ status: HttpStatus.OK, type: ListResponse })
    // endregion Swagger Docs
    public async getList(
        @Query(new ToArrayPipe("tags"), new ParseIntPipe()) query: GoodsQueryDto
    ) {
        const categoryModels =
            await this.categoriesSvr.getObjectsByTags(query.tags);
        // If No hit category
        if (categoryModels.length === 0) {
            return UtilService.toListRespone([ ]);
        }

        const categoryMap = reduce(categoryModels, (obj, cate) => {
            obj[cate._id.toString()] = cate;
            return obj;
        }, { });

        const cids = Object.keys(categoryMap);
        const goodDocs = await this.goodsSvr.getByCids(cids, query);
        const goods = [ ];
        for (const doc of goodDocs) {
            const good = doc.toObject() as IGoodsRaw;
            const category = categoryMap[good.category.toString()];
            // delete good.category;
            good.uploader = good.uploader.nickname as any;
            // good.tags =
            //     Array.from(new Set(good.tags.concat(category.tags)));
            good.attributes = Array.from(new Set(
                good.attributes.concat(category.attributes)
            )) as any;
            good.downloaded =
                await this.logsSvr.goodDownloadCount(good._id);

            for (const key of ["active", "hidden", "tags"]) {
                delete good[key];
            }

            goods.push(good);
        }
        return UtilService.toListRespone(goods, Object.assign({
            total: await this.goodsSvr.countByCids(cids)
        }, query));
    }
}
