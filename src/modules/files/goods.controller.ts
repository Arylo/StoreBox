import {
    UseGuards, Controller, Get, HttpCode, HttpStatus, Query
} from "@nestjs/common";
import { ApiUseTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { UtilService } from "@services/util";
import { IUser } from "@models/User";
import { IGoodsRaw } from "@models/Good";
import { RolesGuard } from "@guards/roles";
import { GoodsService } from "@services/goods";
import { CategoriesService } from "@services/categories";
import { Roles } from "@decorators/roles";
import { ToArrayPipe } from "@pipes/to-array";
import { ListResponse, DEF_PER_COUNT } from "@dtos/page";
import { LogsService } from "@services/logs";
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
        @Query(new ToArrayPipe("tags")) query: GoodsQueryDto
    ) {
        const categoryModels =
            await this.categoriesSvr.getObjectsByTags(query.tags);
        const categories = reduce(categoryModels, (obj, cate) => {
            obj[cate._id.toString()] = cate;
            return obj;
        }, { });
        if (Object.keys(categories).length === 0) {
            return UtilService.toListRespone([ ]);
        }

        const cids = Object.keys(categories);
        const goods =
            (await this.goodsSvr.getByCids(cids, query))
            .map((doc) => {
                const good = doc.toObject() as IGoodsRaw;
                const category = categories[good.category.toString()];
                // delete good.category;
                good.uploader = good.uploader.nickname as any;
                good.tags =
                    Array.from(new Set(good.tags.concat(category.tags)));
                good.attributes = Array.from(new Set(
                    good.attributes.concat(category.attributes)
                )) as any;
                good.downloaded = this.logsSvr.goodDownloadCount(good._id);
                return good;
            });
        return UtilService.toListRespone(goods, Object.assign({
            total: await this.goodsSvr.countByCids(cids)
        }, query));
    }
}
