import {
    Controller, Req, Res, Body, Get, Post, Param, Session,
    HttpStatus, BadRequestException, UseGuards, Delete, HttpCode, Query
} from "@nestjs/common";
import {
    ApiBearerAuth, ApiUseTags, ApiResponse, ApiOperation, ApiImplicitParam,
    ApiImplicitBody
} from "@nestjs/swagger";
import { IValues, Model as ValuesModel } from "@models/Value";
import { Model as GoodsModels } from "@models/Good";
import { Model as RegexpModel } from "@models/Regexp";
import { ObjectId } from "@models/common";
import { config } from "@utils/config";
import { GidDto } from "@dtos/ids";
import { RolesGuard } from "@guards/roles";
import { Roles } from "@decorators/roles";
import { PerPageDto, ListResponse } from "@dtos/page";
import * as hasha from "hasha";
import fs = require("fs-extra");
import multer  = require("multer");

import { CreateValueDto, EditValueDto } from "../values/values.dto";
import { GoodAttributeParamDto } from "./goods.dto";

@UseGuards(RolesGuard)
@Controller("api/v1/goods")
@ApiUseTags("goods")
@ApiBearerAuth()
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
export class GoodsAdminController {

    @Roles("admin")
    @Get()
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Goods List" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Goods List",
        type: ListResponse
    })
    // endregion Swagger Docs
    public async getGoods(@Query() query: PerPageDto) {
        const curPage = query.page || 1;
        const totalPage =
            await GoodsModels.countGoodsByUids([ ], query.perNum);
        const resData = new ListResponse();
        resData.current = curPage;
        resData.total = totalPage;
        if (totalPage >= curPage) {
            resData.data = await GoodsModels.getGoodsByUids(
                [ ], query.perNum, query.page
            );
        }
        return resData;
    }

    @Roles("admin", "token")
    @Post()
    // region Swagger Docs
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ title: "Upload Good" })
    // endregion Swagger Docs
    public async add(@Req() req, @Session() session) {
        const file: Express.Multer.File = req.file;
        const regexpCount = (await RegexpModel.list()).length;
        if (regexpCount === 0) {
            fs.remove(file.path);
            throw new BadRequestException("Lost The Good Role");
        }
        const categories = await RegexpModel.discern(req.file.originalname);
        if (categories.length !== 1) {
            fs.remove(file.path);
            if (categories.length === 0) {
                throw new BadRequestException("Lost Role for the file");
            } else {
                throw new BadRequestException("Much Role for the file");
            }
        }
        let goodObj;
        try {
            const md5sum =
                hasha.fromFileSync(file.path, { algorithm: "md5" });
            const sha256sum =
                hasha.fromFileSync(file.path, { algorithm: "sha256" });
            goodObj = await GoodsModels.create({
                filename: file.filename,
                originname: file.originalname,
                category: categories[0]._id,
                uploader: session.loginUserId,
                md5sum, sha256sum,
                active: true
            });
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        const newFilePath =
            `${config.paths.upload}/${categories[0]._id}/${file.filename}`;
        fs.move(file.path, newFilePath);
        return goodObj;
    }

    @Roles("admin")
    @Get("/:gid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Get Good Info" })
    // endregion Swagger Docs
    public async get(@Param() param: GidDto) {
        let obj;
        try {
            obj = await GoodsModels.findById(param.gid)
                .populate("uploader", "nickname")
                .populate("attributes")
                .populate("category", "name attributes tags")
                .exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        return obj;
    }

    @Roles("admin")
    @Post("/:gid/attributes")
    // region Swagger Docs
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ title: "Add Attributes" })
    // endregion Swagger Docs
    public async addAttr(
        @Param() param: GidDto, @Body() ctx: CreateValueDto
    ) {
        const obj = await GoodsModels.findById(param.gid)
            .populate("attributes")
            .exec();
        if (!obj) {
            // TODO throw
        }
        const attributes = obj.toObject().attributes as IValues[];
        if (attributes.length !== 0) {
            const attrSet = new Set<string>();
            attributes.reduce((set, cur) => {
                set.add(cur.key);
                return set;
            }, attrSet);
            if (attrSet.has(ctx.key)) {
                throw new BadRequestException("The Attributes is exist");
            }
        }
        const newAttr = await ValuesModel.create(ctx);
        await GoodsModels.findByIdAndUpdate(
            param.gid, { $push: { attributes: newAttr._id } }
        ).exec();
        return { statusCode: HttpStatus.CREATED };
    }

    @Roles("admin")
    @Post("/:gid/attributes/:aid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Edit Attribute" })
    // endregion Swagger Docs
    public async editAttr(
        @Param() param: GoodAttributeParamDto, @Body() ctx: EditValueDto
    ) {
        try {
            await ValuesModel.findByIdAndUpdate(param.aid, ctx).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        return { statusCode: HttpStatus.OK };
    }

    @Roles("admin")
    @Delete("/:gid/attributes/:aid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete Attribute" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete Attribute Success"
    })
    // endregion Swagger Docs
    public deleteAttrByDelete(@Param() param: GoodAttributeParamDto) {
        return this.deleteAttrByGet(param);
    }

    @Roles("admin")
    @Get("/:gid/attributes/:aid/delete")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete Attribute" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete Attribute Success"
    })
    // endregion Swagger Docs
    public async deleteAttrByGet(@Param() param: GoodAttributeParamDto) {
        try {
            await GoodsModels.findByIdAndUpdate(param.gid, {
                $pull: { attributes: param.aid}
            }).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        try {
            await ValuesModel.findByIdAndRemove(param.aid).exec();
        } catch (error) {
            await GoodsModels.findByIdAndUpdate(
                param.gid, { $push: { attributes: param.aid } }
            ).exec();
            throw new BadRequestException(error.toString());
        }
        return { statusCode: HttpStatus.OK };
    }

}
