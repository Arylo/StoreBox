import {
    Controller, Post, Res, Body, Get, HttpStatus, HttpCode, Param,
    BadRequestException, UseGuards, Delete, Query, BadGatewayException
} from "@nestjs/common";
import {
    ApiBearerAuth, ApiUseTags, ApiResponse, ApiImplicitParam, ApiOperation
} from "@nestjs/swagger";
import { Model as ValuesModel, ValueDoc, IValues } from "@models/Value";
import { Roles } from "@decorators/roles";
import { RolesGuard } from "@guards/roles";
import { ParseIntPipe } from "@pipes/parse-int";
import { PerPageDto, ListResponse } from "@dtos/page";
import { CidDto } from "@dtos/ids";
import { DefResDto } from "@dtos/res";
import { CategoriesService } from "@services/categories";
import { GoodsService } from "@services/goods";
import { UtilService } from "@services/util";
import md5 = require("md5");

import {
    NewCategoryDto, EditCategoryDto, CategoryAttributeParamDto
} from "./categroies.dto";
import { CreateValueDto, EditValueDto } from "../values/values.dto";

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
        let result;
        try {
            result = await this.categoriesSvr.add({
                name: ctx.name,
                tags: ctx.tags,
                attributes: attrsIds,
                pid: ctx.pid
            });
        } catch (error) {
            attrsIds.forEach((id) => {
                ValuesModel.findByIdAndRemove(id).exec();
            });
            throw new BadRequestException(error.toString());
        }
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
        const arr = (await this.goodsSvr.listByCategoryId(param.cid))
            .map((doc) => {
                return doc.toObject();
            });
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
    @Post("/:cid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Edit Category" })
    // endregion Swagger Docs
    public async edit(
        @Param() param: CidDto, @Body() ctx: EditCategoryDto
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
        let parentCategory;
        if (ctx.pid) {
            parentCategory = await this.categoriesSvr.getById(ctx.pid, {
                populate: [
                    "attributes",
                    {
                        path: "pid", populate: { path: "pid" }
                    }
                ]
            });
            if (!parentCategory) {
                throw new BadRequestException(
                    "The Parent Category isnt exist!"
                );
            }
        }
        await this.categoriesSvr.editById(param.cid, ctx);
        return new DefResDto();
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
