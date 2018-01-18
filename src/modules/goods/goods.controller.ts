import {
    Controller, Req, Res, Body, Get, Post, Param, Session,
    HttpStatus, BadRequestException, UseGuards
} from "@nestjs/common";
import {
    ApiBearerAuth, ApiUseTags, ApiResponse, ApiOperation, ApiImplicitParam,
    ApiImplicitBody
} from "@nestjs/swagger";
import { IValues, Model as ValuesModel } from "@models/Value";
import { Model as GoodsModels } from "@models/Good";
import { Model as RegexpModel } from "@models/Regexp";
import { config } from "@utils/config";

import { CreateValueDto, EditValueDto } from "../values/values.dto";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";

import * as hasha from "hasha";
import fs = require("fs-extra");
import multer  = require("multer");

@UseGuards(RolesGuard)
@Controller("api/v1/goods")
@ApiUseTags("goods")
@ApiBearerAuth()
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
export class GoodsController {

    @Roles("admin", "token")
    @Post()
    @ApiOperation({ title: "Upload Good" })
    public async add(@Req() req, @Res() res, @Session() session) {
        const file: Express.Multer.File = req.file;
        const regexpCount = (await RegexpModel.list()).length;
        if (regexpCount === 0) {
            fs.remove(file.path);
            throw new BadRequestException("Lost The Good Role");
        }
        const catgroies = await RegexpModel.discern(req.file.originalname);
        if (catgroies.length !== 1) {
            fs.remove(file.path);
            if (catgroies.length === 0) {
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
                categroy: catgroies[0]._id,
                uploader: session.loginUserId,
                md5sum, sha256sum,
                active: true
            });
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        const newFilePath =
            `${config.paths.upload}/${catgroies[0]._id}/${file.filename}`;
        fs.move(file.path, newFilePath);
        res.status(HttpStatus.CREATED).json(goodObj);
    }

    @Roles("admin")
    @Get("/:id")
    @ApiOperation({ title: "Get Good Info" })
    @ApiImplicitParam({ name: "id", description: "Good ID" })
    public async get(@Res() res, @Param("id") id) {
        let obj;
        try {
            obj = await GoodsModels.findById(id)
                .populate("uploader", "nickname")
                .populate("attributes")
                .populate("categroy", "name attributes tags")
                .exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        res.status(HttpStatus.OK).json(obj);
    }

    @Roles("admin")
    @Post("/:id/attributes")
    @ApiOperation({ title: "Add Attributes" })
    @ApiImplicitParam({ name: "id", description: "Good ID" })
    public async addAttr(
        @Res() res, @Param("id") id, @Body() ctx: CreateValueDto
    ) {
        const obj = await GoodsModels.findById(id)
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
            id, { $push: { attributes: newAttr._id } }
        ).exec();
        res.status(HttpStatus.CREATED).json({ });
    }

    @Roles("admin")
    @Post("/:id/attributes/:aid")
    @ApiOperation({ title: "Edit Attribute" })
    @ApiImplicitParam({ name: "id", description: "Good ID" })
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
    @ApiOperation({ title: "Delete Attribute" })
    @ApiImplicitParam({ name: "id", description: "Good ID" })
    @ApiImplicitParam({ name: "aid", description: "Attribute ID" })
    public async deleteAttr(@Param("id") id, @Param("aid") aid) {
        try {
            await GoodsModels.findByIdAndUpdate(id, {
                $pull: { attributes: aid}
            }).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        try {
            await ValuesModel.findByIdAndRemove(aid).exec();
        } catch (error) {
            await GoodsModels.findByIdAndUpdate(
                id, { $push: { attributes: aid } }
            ).exec();
            throw new BadRequestException(error.toString());
        }
        return { };
    }

}
