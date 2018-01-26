import {
    Controller, Post, Res, Body, Get, HttpStatus, HttpCode, Param,
    BadRequestException, UseGuards, Delete, Query
} from "@nestjs/common";
import {
    ApiBearerAuth, ApiUseTags, ApiResponse, ApiImplicitParam, ApiOperation
} from "@nestjs/swagger";
import {
    Model as CategoriesModel, CategoryDoc, ICategory
} from "@models/Categroy";
import { Model as ValuesModel, ValueDoc, IValues } from "@models/Value";
import { Model as GoodsModels } from "@models/Good";
import { Roles } from "@decorators/roles";
import { RolesGuard } from "@guards/roles";
import { ParseIntPipe } from "@pipes/parse-int";
import { PerPageDto, ListResponse } from "@dtos/page";
import md5 = require("md5");

import { NewCategoryDto, EditCategoryDto } from "./categroies.dto";
import { CreateValueDto, EditValueDto } from "../values/values.dto";

@UseGuards(RolesGuard)
@Controller("api/v1/categories")
// region Swagger Docs
@ApiUseTags("categories")
@ApiBearerAuth()
// endregion Swagger Docs
export class CategoriesAdminController {

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
        const curPage = query.page || 1;
        const totalPage = await CategoriesModel.pageCount(query.perNum);
        const data = new ListResponse<ICategory | CategoryDoc>();
        data.current = curPage;
        data.total = totalPage;
        if (totalPage >= curPage) {
            data.data = await CategoriesModel.list(query.perNum, query.page);
        }
        return data;
    }

    @Roles("admin")
    @Post()
    @ApiOperation({ title: "Add Category" })
    public async add(@Res() res, @Body() ctx: NewCategoryDto) {
        if (ctx.pid && !(await CategoriesModel.findById(ctx.pid).exec())) {
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
            result = await CategoriesModel.create({
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
        res.status(HttpStatus.CREATED).send(result);
    }

    @Roles("admin")
    @Get("/:id")
    // region Swagger Docs
    @ApiOperation({ title: "Get Category Info" })
    @ApiImplicitParam({ name: "id", description: "Category ID" })
    // endregion Swagger Docs
    public async get(@Res() res, @Param("id") id) {
        let obj: ICategory;
        try {
            const doc = await CategoriesModel.findById(id)
                .populate("attributes")
                .populate({
                    path: "pid", populate: { path: "pid" }
                })
                .exec();
            obj = doc.toObject();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        obj.goods = (
            await GoodsModels.find({ category: obj._id })
                .populate("uploader")
                .populate("attributes")
                .select("-category")
                .exec()
        ).map((doc) => {
            return doc.toObject();
        });
        res.status(HttpStatus.OK).send(obj);
    }

    @Roles("admin")
    @Post("/:id/attributes")
    // region Swagger Docs
    @ApiOperation({ title: "Add Attribute" })
    @ApiImplicitParam({ name: "id", description: "Category ID" })
    // endregion Swagger Docs
    public async addAttr(
        @Res() res, @Param("id") id, @Body() ctx: CreateValueDto
    ) {
        const curCategory = (
            await CategoriesModel.findById(id).populate("attributes").exec()
        ).toObject();
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
        await CategoriesModel.findByIdAndUpdate(
            id, { $push: { attributes: newAttr._id } }
        ).exec();
        res.status(HttpStatus.CREATED).json({ });
    }

    @Roles("admin")
    @Post("/:id/attributes/:aid")
    // region Swagger Docs
    @ApiOperation({ title: "Edit Category" })
    @ApiImplicitParam({ name: "id", description: "Category ID" })
    @ApiImplicitParam({ name: "aid", description: "Attribute ID" })
    // endregion Swagger Docs
    public async editAttr(
        @Res() res, @Param("aid") aid, @Body() ctx: EditValueDto
    ) {
        try {
            await ValuesModel.findByIdAndUpdate(aid, ctx).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        res.status(HttpStatus.OK).json();
    }

    @Roles("admin")
    @Delete("/:id/attributes/:aid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete Category" })
    @ApiImplicitParam({ name: "id", description: "Category ID" })
    @ApiImplicitParam({ name: "aid", description: "Attribute ID" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete Attribute Success"
    })
    // endregion Swagger Docs
    public deleteAttrByDelete(@Param("id") id, @Param("aid") aid) {
        return this.deleteAttrByGet(id, aid);
    }

    @Roles("admin")
    @Get("/:id/attributes/:aid/delete")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete Category" })
    @ApiImplicitParam({ name: "id", description: "Category ID" })
    @ApiImplicitParam({ name: "aid", description: "Attribute ID" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete Attribute Success"
    })
    // endregion Swagger Docs
    public async deleteAttrByGet(@Param("id") id, @Param("aid") aid) {
        try {
            await CategoriesModel.findByIdAndUpdate(id, {
                $pull: { attributes: aid}
            }).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        try {
            await ValuesModel.findByIdAndRemove(aid).exec();
        } catch (error) {
            await CategoriesModel.findByIdAndUpdate(
                id, { $push: { attributes: aid } }
            ).exec();
            throw new BadRequestException(error.toString());
        }
        return { };
    }

    @Roles("admin")
    @Post("/:id")
    // region Swagger Docs
    @ApiOperation({ title: "Edit Category" })
    @ApiImplicitParam({ name: "id", description: "Category ID" })
    // endregion Swagger Docs
    public async edit(
        @Res() res, @Param("id") id, @Body() ctx: EditCategoryDto
    ) {
        const curCategory = (
            await CategoriesModel.findById(id)
                .populate("attributes")
                .populate({
                    path: "pid", populate: { path: "pid" }
                }).exec()
        ).toObject();
        let parentCategory;
        if (ctx.pid) {
            parentCategory = await CategoriesModel.findById(ctx.pid)
                .populate("attributes")
                .populate({
                    path: "pid", populate: { path: "pid" }
                }).exec();
            if (!parentCategory) {
                throw new BadRequestException(
                    "The Parent Category isnt exist!"
                );
            }
        }
        try {
            await CategoriesModel.findByIdAndUpdate(id, ctx).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        res.status(HttpStatus.OK).json();
    }

    @Roles("admin")
    @Delete("/:id")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete Category" })
    @ApiImplicitParam({ name: "id", description: "Category ID" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete Category Success"
    })
    // endregion Swagger Docs
    public deleteByDelete(@Param("id") id) {
        return this.deleteByGet(id);
    }

    @Roles("admin")
    @Get("/:id/delete")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete Category" })
    @ApiImplicitParam({ name: "id", description: "Category ID" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete Category Success"
    })
    // endregion Swagger Docs
    public async deleteByGet(@Param("id") id) {
        try {
            await CategoriesModel.findByIdAndRemove(id).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        return { };
    }
}
