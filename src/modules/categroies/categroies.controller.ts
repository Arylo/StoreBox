import {
    Controller, Post, Res, Body, Get, HttpStatus, HttpCode, HttpException, Param
} from "@nestjs/common";
import {
    Model as CategroiesModel, CategroyDoc, ICategroy
} from "@models/Categroy";
import { Model as ValuesModel, ValueDoc, IValues } from "@models/Value";
import { NewCategroyDto, EditCategroyDto } from "./categroies.dto";
import { CreateValueDto, EditValueDto } from "../values/values.dto";
import { Model as GoodsModels } from "@models/Good";

import md5 = require("md5");

@Controller("categroies")
export class CategroiesController {

    @HttpCode(HttpStatus.OK)
    @Get()
    public async list() {
        return await CategroiesModel.find()
            .select("-attributes")
            .exec();
    }

    @Post()
    public async add(@Res() res, @Body() ctx: NewCategroyDto) {
        if (ctx.pid && !(await CategroiesModel.findById(ctx.pid).exec())) {
            throw new HttpException(
                "The Parent Categroy isnt exist!", HttpStatus.BAD_REQUEST
            );
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
                    throw new HttpException(
                        error.toString(), HttpStatus.BAD_REQUEST
                    );
                }
                return { key, value };
            });
            let attrs = [ ];
            try {
                attrs = await ValuesModel.create(attributes);
            } catch (error) {
                throw new HttpException(
                    error.toString(), HttpStatus.BAD_REQUEST
                );
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
            throw new HttpException(error.toString(), HttpStatus.BAD_REQUEST);
        }
        res.status(HttpStatus.CREATED).send(result);
    }

    @Get("/:id")
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
            throw new HttpException(error.toString(), HttpStatus.BAD_REQUEST);
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

    @Post("/:id/attributes")
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
                throw new HttpException(
                    "The Attributes is exist", HttpStatus.BAD_REQUEST
                );
            }
        }
        const newAttr = await ValuesModel.create(ctx);
        await CategroiesModel.findByIdAndUpdate(
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

    @Post("/:id/attributes/:aid/delete")
    public async deleteAttr(@Param("id") id, @Param("aid") aid) {
        try {
            await CategroiesModel.findByIdAndUpdate(id, {
                $pull: { attributes: aid}
            }).exec();
        } catch (error) {
            throw new HttpException(error.toString(), HttpStatus.BAD_REQUEST);
        }
        try {
            await ValuesModel.findByIdAndRemove(aid).exec();
        } catch (error) {
            await CategroiesModel.findByIdAndUpdate(
                id, { $push: { attributes: aid } }
            ).exec();
            throw new HttpException(error.toString(), HttpStatus.BAD_REQUEST);
        }
        return { };
    }

    @Post("/:id")
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
                throw new HttpException(
                    "The Parent Categroy isnt exist!", HttpStatus.BAD_REQUEST
                );
            }
            // TODO parent Dead Loop
        }
        try {
            await CategroiesModel.findByIdAndUpdate(id, ctx).exec();
        } catch (error) {
            throw new HttpException(error.toString(), HttpStatus.BAD_REQUEST);
        }
        res.status(HttpStatus.OK).json();
    }

    @Post("/:id/delete")
    public async delete(@Res() res, @Param("id") id) {
        try {
            await CategroiesModel.findByIdAndRemove(id).exec();
        } catch (error) {
            throw new HttpException(error.toString(), HttpStatus.BAD_REQUEST);
        }
        res.status(HttpStatus.OK).json();
    }
}
