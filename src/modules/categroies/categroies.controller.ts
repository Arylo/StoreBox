import {
    Controller, Post, Res, Body, Get, HttpStatus, HttpCode, Param,
    BadRequestException, UseGuards
} from "@nestjs/common";
import {
    ApiBearerAuth, ApiUseTags, ApiResponse, ApiImplicitParam, ApiOperation
} from "@nestjs/swagger";
import {
    Model as CategroiesModel, CategroyDoc, ICategroy
} from "@models/Categroy";
import { Model as ValuesModel, ValueDoc, IValues } from "@models/Value";
import { Model as GoodsModels } from "@models/Good";

import md5 = require("md5");

import { NewCategroyDto, EditCategroyDto } from "./categroies.dto";
import { CreateValueDto, EditValueDto } from "../values/values.dto";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";

@UseGuards(RolesGuard)
@Controller("api/v1/categroies")
@ApiUseTags("categroies")
@ApiBearerAuth()
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
export class CategroiesController {

    @Roles("admin")
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Categroy List" })
    public async list() {
        return await CategroiesModel.find()
            .select("-attributes")
            .exec();
    }

    @Roles("admin")
    @Post()
    @ApiOperation({ title: "Add Categroy" })
    public async add(@Res() res, @Body() ctx: NewCategroyDto) {
        if (ctx.pid && !(await CategroiesModel.findById(ctx.pid).exec())) {
            throw new BadRequestException("The Parent Categroy isnt exist!");
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
            result = await CategroiesModel.create({
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
    @ApiOperation({ title: "Get Categroy Info" })
    @ApiImplicitParam({ name: "id", description: "Categroy ID" })
    public async get(@Res() res, @Param("id") id) {
        let obj: ICategroy;
        try {
            const doc = await CategroiesModel.findById(id)
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
            await GoodsModels.find({ categroy: obj._id })
                .populate("uploader")
                .populate("attributes")
                .select("-categroy")
                .exec()
        ).map((doc) => {
            return doc.toObject();
        });
        res.status(HttpStatus.OK).send(obj);
    }

    @Roles("admin")
    @Post("/:id/attributes")
    @ApiOperation({ title: "Add Attribute" })
    @ApiImplicitParam({ name: "id", description: "Categroy ID" })
    public async addAttr(
        @Res() res, @Param("id") id, @Body() ctx: CreateValueDto
    ) {
        const curCategroy = (
            await CategroiesModel.findById(id).populate("attributes").exec()
        ).toObject();
        const attributes = curCategroy.attributes as IValues[];
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
        await CategroiesModel.findByIdAndUpdate(
            id, { $push: { attributes: newAttr._id } }
        ).exec();
        res.status(HttpStatus.CREATED).json({ });
    }

    @Roles("admin")
    @Post("/:id/attributes/:aid")
    @ApiOperation({ title: "Edit Categroy" })
    @ApiImplicitParam({ name: "id", description: "Categroy ID" })
    @ApiImplicitParam({ name: "aid", description: "Attribute ID" })
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
    @Get("/:id/attributes/:aid/delete")
    @ApiOperation({ title: "Delete Categroy" })
    @ApiImplicitParam({ name: "id", description: "Categroy ID" })
    @ApiImplicitParam({ name: "aid", description: "Attribute ID" })
    public async deleteAttr(@Param("id") id, @Param("aid") aid) {
        try {
            await CategroiesModel.findByIdAndUpdate(id, {
                $pull: { attributes: aid}
            }).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        try {
            await ValuesModel.findByIdAndRemove(aid).exec();
        } catch (error) {
            await CategroiesModel.findByIdAndUpdate(
                id, { $push: { attributes: aid } }
            ).exec();
            throw new BadRequestException(error.toString());
        }
        return { };
    }

    @Roles("admin")
    @Post("/:id")
    @ApiOperation({ title: "Edit Categroy" })
    @ApiImplicitParam({ name: "id", description: "Categroy ID" })
    public async edit(
        @Res() res, @Param("id") id, @Body() ctx: EditCategroyDto
    ) {
        const curCategroy = (
            await CategroiesModel.findById(id)
                .populate("attributes")
                .populate({
                    path: "pid", populate: { path: "pid" }
                }).exec()
        ).toObject();
        let parentCategroy;
        if (ctx.pid) {
            parentCategroy = await CategroiesModel.findById(ctx.pid)
                .populate("attributes")
                .populate({
                    path: "pid", populate: { path: "pid" }
                }).exec();
            if (!parentCategroy) {
                throw new BadRequestException(
                    "The Parent Categroy isnt exist!"
                );
            }
        }
        try {
            await CategroiesModel.findByIdAndUpdate(id, ctx).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        res.status(HttpStatus.OK).json();
    }

    @Roles("admin")
    @Get("/:id/delete")
    @ApiOperation({ title: "Delete Categroy" })
    @ApiImplicitParam({ name: "id", description: "Categroy ID" })
    public async delete(@Res() res, @Param("id") id) {
        try {
            await CategroiesModel.findByIdAndRemove(id).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        res.status(HttpStatus.OK).json();
    }
}
