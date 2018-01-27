import {
    UseGuards, Controller, Get, HttpCode, HttpStatus, Query
} from "@nestjs/common";
import { ApiUseTags, ApiOperation } from "@nestjs/swagger";
import { Model as CategoriesModel } from "@models/Categroy";
import { RolesGuard } from "@guards/roles";
import { Roles } from "@decorators/roles";
import { ParseIntPipe } from "@pipes/parse-int";
import { GoodsQueryDto, GoodsResponseDto } from "./goods.dto";
import { Model as GoodsModels } from "@models/Good";
import { IUser } from "@models/User";
import { reduce } from "lodash";
import { IGoodsRaw } from "@models/Good";

@UseGuards(RolesGuard)
@Controller("goods")
@ApiUseTags("Good Download")
export class GoodsController {

    @Roles("guest")
    @Get()
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Good List" })
    // endregion Swagger Docs
    public async getList(@Query(new ParseIntPipe()) query: GoodsQueryDto) {
        const data = new GoodsResponseDto();
        const categoryModels = await CategoriesModel.getCategories(query.tags);
        const categories = reduce(categoryModels, (obj, cate) => {
            obj[cate._id.toString()] = cate;
            return obj;
        }, { });
        if (Object.keys(categories).length === 0) {
            return data;
        }
        // const categories = categoryDocs.map((item) => item.toObject());
        const cids = Object.keys(categories);
        const goods =
            (await GoodsModels.getGoodsByCids(cids, query.perNum, query.page))
            .map((doc) => {
                const good = doc.toObject() as IGoodsRaw;
                const category = categories[good.category.toString()];
                delete good.category;
                good.uploader = good.uploader.nickname as any;
                good.tags =
                    Array.from(new Set(good.tags.concat(category.tags)));
                good.attributes = Array.from(new Set(
                    good.attributes.concat(category.attributes)
                )) as any;
                return good;
            });
        data.data = goods;
        data.total = await GoodsModels.countGoodsByCids(cids, query.perNum);
        return data;
    }
}
