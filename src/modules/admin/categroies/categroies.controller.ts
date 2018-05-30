import { Roles } from "@decorators/roles";
import { CidDto } from "@dtos/ids";
import { ListResponse, PerPageDto } from "@dtos/page";
import { DefResDto } from "@dtos/res";
import { CreateValueDto, EditValueDto } from "@dtos/values";
import { RolesGuard } from "@guards/roles";
import { IValues, Model as ValuesModel, ValueDoc } from "@models/Value";
import {
    BadGatewayException, BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus,
    Param, Post, Put, Query, Res, UseGuards
} from "@nestjs/common";
import {
    ApiBearerAuth, ApiImplicitParam, ApiOperation, ApiResponse, ApiUseTags
} from "@nestjs/swagger";
import { ParseIntPipe } from "@pipes/parse-int";
import { ToArrayPipe } from "@pipes/to-array";
import { CategoriesService } from "@services/categories";
import { GoodsService } from "@services/goods";
import { UtilService } from "@services/util";
import md5 = require("md5");
import {
    CategoryAttributeParamDto, EditCategoryDto, NewCategoryDto
} from "./categroies.dto";

@UseGuards(RolesGuard)
@Controller("api/v1/categories")
// region Swagger Docs
@ApiUseTags("categories")
@ApiBearerAuth()
// endregion Swagger Docs
export class CategoriesAdminController {

    constructor(
        private readonly categoriesSvr: CategoriesService,
        private readonly goodsSvr: GoodsService
    ) { }

    @Roles("admin")
    @Get()
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Category List" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Category List",
        type: ListResponse
    })
    // endregion Swagger Docs
    public async list(@Query(new ParseIntPipe()) query: PerPageDto) {
        const arr = await this.categoriesSvr.list(query);
        return UtilService.toListRespone(arr, Object.assign({
            total: await this.categoriesSvr.count()
        }, query));
    }

    @Roles("admin")
    @Post()
    // region Swagger Docs
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ title: "Add Category" })
    // endregion Swagger Docs
    public async add(@Body() ctx: NewCategoryDto) {
        if (ctx.pid && !(await this.categoriesSvr.getById(ctx.pid))) {
            throw new BadRequestException("The Parent Category isnt exist!");
        }
        let attrsIds = [ ];
        if (ctx.attributes) {
            const attributes = ctx.attributes.map((str) => {
                let key, value;
                try {
                    const obj = JSON.parse(str);
                    key = obj.key;
                    value = obj.value;
                } catch (error) {
                    throw new BadRequestException(error.toString());
                }
                return { key, value };
            });
            let attrs = [ ];
            try {
                attrs = await ValuesModel.create(attributes);
            } catch (error) {
                throw new BadRequestException(error.toString());
            }
            attrsIds = attrsIds.concat(
                attrs.map((item) => item.toObject()._id)
            );
        }
        const result = await this.categoriesSvr.add({
            name: ctx.name,
            tags: ctx.tags,
            attributes: attrsIds,
            pid: ctx.pid
        });
        return result;
    }

    @Roles("admin")
    @Get("/:cid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Category Info" })
    // endregion Swagger Docs
    public async get(
        @Param() param: CidDto, @Query(new ParseIntPipe()) query: PerPageDto
    ) {
        let obj;
        try {
            const doc = await this.categoriesSvr.getById(param.cid, {
                populate: [
                    "attributes",
                    {
                        path: "pid", populate: { path: "pid" }
                    }
                ]
            });
            if (!obj) {
                return doc;
            }
            obj = doc.toObject();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        const arr = await this.goodsSvr.listByCategoryId(param.cid);
        obj.goods = UtilService.toListRespone(arr, query);
        return obj;
    }

    @Roles("admin")
    @Post("/:cid/attributes")
    // region Swagger Docs
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ title: "Add Attribute" })
    // endregion Swagger Docs
    public async addAttr(
        @Param() param: CidDto, @Body() ctx: CreateValueDto
    ) {
        const category =
            await this.categoriesSvr.getById(param.cid, {
                populate: [ "attributes" ]
            });
        if (!category) {
            throw new BadGatewayException("Non Exist Category");
        }
        const curCategory = category.toObject();
        const attributes = curCategory.attributes as IValues[];
        if (attributes.length !== 0) {
            const attrSet = new Set<string>();
            attributes.reduce((set, cur) => {
                set.add(md5(cur.key));
                return set;
            }, attrSet);
            const curValue = {
                key: md5(ctx.key)
            };
            if (attrSet.has(curValue.key)) {
                throw new BadRequestException("The Attributes is exist");
            }
        }
        const newAttr = await ValuesModel.create(ctx);
        await this.categoriesSvr.editById(
            param.cid, { $push: { attributes: newAttr._id } }
        );
        return newAttr;
    }

    @Roles("admin")
    @Post("/:cid/attributes/:aid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Edit Category" })
    // endregion Swagger Docs
    public async editAttr(
        @Param() param: CategoryAttributeParamDto, @Body() ctx: EditValueDto
    ) {
        try {
            await ValuesModel.findByIdAndUpdate(param.aid, ctx).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        return new DefResDto();
    }

    @Roles("admin")
    @Delete("/:cid/attributes/:aid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete Category" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete Attribute Success"
    })
    // endregion Swagger Docs
    public deleteAttrByDelete(@Param() param: CategoryAttributeParamDto) {
        return this.deleteAttrByGet(param);
    }

    @Roles("admin")
    @Get("/:cid/attributes/:aid/delete")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete Category" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete Attribute Success"
    })
    // endregion Swagger Docs
    public async deleteAttrByGet(@Param() param: CategoryAttributeParamDto) {
        await this.categoriesSvr.editById(param.cid, {
            $pull: { attributes: param.aid}
        });
        try {
            await ValuesModel.findByIdAndRemove(param.aid).exec();
        } catch (error) {
            await this.categoriesSvr.editById(
                param.cid, { $push: { attributes: param.aid } }
            );
            throw new BadRequestException(error.toString());
        }
        return { status: HttpStatus.OK };
    }

    @Roles("admin")
    @Put("/:cid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Edit Category" })
    // endregion Swagger Docs
    public async edit(
        @Param() param: CidDto,
        @Body(new ToArrayPipe("tags")) ctx: EditCategoryDto
    ) {
        const curCategory =
            await this.categoriesSvr.getById(param.cid, {
                populate: [
                    "attributes",
                    {
                        path: "pid", populate: { path: "pid" }
                    }
                ]
            });
        if (!curCategory) {
            throw new BadGatewayException("Non Exist Category");
        }
        await this.categoriesSvr.editById(param.cid, ctx);
        return new DefResDto();
    }

    @Roles("admin")
    @Post("/:cid")
    public editByPost(
        @Param() param: CidDto,
        @Body(new ToArrayPipe("tags")) ctx: EditCategoryDto
    ) {
        return this.edit(param, ctx);
    }

    @Roles("admin")
    @Delete("/:cid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete Category" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete Category Success"
    })
    // endregion Swagger Docs
    public deleteByDelete(@Param() param: CidDto) {
        return this.deleteByGet(param);
    }

    @Roles("admin")
    @Get("/:cid/delete")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete Category" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete Category Success"
    })
    // endregion Swagger Docs
    public async deleteByGet(@Param() param: CidDto) {
        await this.categoriesSvr.removeById(param.cid);
        return new DefResDto();
    }
}
