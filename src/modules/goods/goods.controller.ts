import {
    Controller, Req, Res, Body, Get, Post, Param, Session,
    HttpStatus, HttpCode, HttpException
} from "@nestjs/common";
import { CreateValueDto, EditValueDto } from "../values/values.dto";
import { IValues, Model as ValuesModel } from "@models/Value";
import { Model as GoodsModels } from "@models/Good";
import { Model as RegexpModel } from "@models/Regexp";
import { config } from "@utils/config";

import fs = require("fs-extra");
import multer  = require("multer");

@Controller("goods")
export class GoodsController {

    @Post()
    public async add(@Req() req, @Res() res, @Session() session) {
        const file: Express.Multer.File = req.file;
        const regexpCount = (await RegexpModel.list()).length;
        if (regexpCount === 0) {
            fs.remove(file.path);
            throw new HttpException(
                "Lost The Good Role", HttpStatus.BAD_GATEWAY
            );
        }
        const catgroies = await RegexpModel.discern(req.file.originalname);
        if (catgroies.length !== 1) {
            fs.remove(file.path);
            if (catgroies.length === 0) {
                throw new HttpException(
                    "Lost Role for the file", HttpStatus.BAD_REQUEST
                );
            } else {
                throw new HttpException(
                    "Much Role for the file", HttpStatus.BAD_REQUEST
                );
            }
        }
        let goodObj;
        try {
            goodObj = await GoodsModels.create({
                filename: file.filename,
                originname: file.originalname,
                categroy: catgroies[0]._id,
                uploader: session.loginUserId
            });
        } catch (error) {
            throw new HttpException(error.toString(), HttpStatus.BAD_GATEWAY);
        }
        const newFilePath =
            `${config.paths.upload}/${catgroies[0]._id}/${file.filename}`;
        fs.move(file.path, newFilePath);
        res.status(HttpStatus.CREATED).json(goodObj);
    }

    @Get("/:id")
    public async get(@Res() res, @Param("id") id) {
        let obj;
        try {
            obj = await GoodsModels.findById(id)
                .populate("uploader", "username nickname")
                .populate("attributes")
                .populate("categroy", "name attributes tags")
                .exec();
        } catch (error) {
            throw new HttpException(error.toString(), HttpStatus.BAD_REQUEST);
        }
        res.status(HttpStatus.OK).json(obj);
    }

    @Post("/:id/attributes")
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
                throw new HttpException(
                    "The Attributes is exist", HttpStatus.BAD_REQUEST
                );
            }
        }
        const newAttr = await ValuesModel.create(ctx);
        await GoodsModels.findByIdAndUpdate(
            id, { $push: { attributes: newAttr._id } }
        ).exec();
        res.status(HttpStatus.CREATED).json({ });
    }

    @Post("/:id/attributes/:aid")
    public async editAttr(
        @Res() res, @Param("aid") aid, @Body() ctx: EditValueDto
    ) {
        try {
            await ValuesModel.findByIdAndUpdate(aid, ctx).exec();
        } catch (error) {
            throw new HttpException(error.toString(), HttpStatus.BAD_REQUEST);
        }
        res.status(HttpStatus.OK).json();
    }

    @Get("/:id/attributes/:aid/delete")
    public async deleteAttr(@Param("id") id, @Param("aid") aid) {
        try {
            await GoodsModels.findByIdAndUpdate(id, {
                $pull: { attributes: aid}
            }).exec();
        } catch (error) {
            throw new HttpException(error.toString(), HttpStatus.BAD_REQUEST);
        }
        try {
            await ValuesModel.findByIdAndRemove(aid).exec();
        } catch (error) {
            await GoodsModels.findByIdAndUpdate(
                id, { $push: { attributes: aid } }
            ).exec();
            throw new HttpException(error.toString(), HttpStatus.BAD_REQUEST);
        }
        return { };
    }

}
