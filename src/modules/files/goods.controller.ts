import {
    UseGuards, Controller, Get, HttpCode, HttpStatus, Query
} from "@nestjs/common";
import { ApiUseTags, ApiOperation } from "@nestjs/swagger";
import { Model as CategroiesModel } from "@models/Categroy";
import { RolesGuard } from "@guards/roles";
import { Roles } from "@decorators/roles";
import { ParseIntPipe } from "@pipes/parse-int";
import { GoodsQueryDto, GoodsResponseDto } from "./goods.dto";
import { Model as GoodsModels } from "@models/Good";
import { IUser } from "@models/User";
import { reduce } from "lodash";
import { IGoodsRaw } from "@models/Good";

@UseGuards(RolesGuard)
@ApiUseTags("goods")
@Controller("goods")
export class GoodsController {

    @Roles("guest")
    @Get()
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Good List" })
    // endregion Swagger Docs
    public async getList(@Query(new ParseIntPipe()) query: GoodsQueryDto) {
        const data = new GoodsResponseDto();
        const categroyModels = await CategroiesModel.getCategroies(query.tags);
        const categroies = reduce(categroyModels, (obj, cate) => {
            obj[cate._id.toString()] = cate;
            return obj;
        }, { });
        if (Object.keys(categroies).length === 0) {
            return data;
        }
        // const categroies = categroyDocs.map((item) => item.toObject());
        const cids = Object.keys(categroies);
        const goods =
            (await GoodsModels.getGoods(cids, query.perNum, query.page))
            .map((doc) => {
                const good = doc.toObject() as IGoodsRaw;
                const categroy = categroies[good.categroy.toString()];
                delete good.categroy;
                good.uploader = good.uploader.nickname as any;
                good.tags =
                    Array.from(new Set(good.tags.concat(categroy.tags)));
                good.attributes = Array.from(new Set(
                    good.attributes.concat(categroy.attributes)
                )) as any;
                return good;
            });
        data.data = goods;
        data.total = await GoodsModels.countGoods(cids, query.perNum);
        return data;
    }
}
