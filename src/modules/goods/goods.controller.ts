import {
    Controller, Post, Res, Body, Get, HttpStatus, HttpCode, HttpException, Param
} from "@nestjs/common";
import { Model as GoodsModels } from "@models/Good";
import { IValues, Model as ValuesModel } from "@models/Value";
import { CreateValueDto, EditValueDto } from "../values/values.dto";

@Controller("goods")
export class GoodsController {

    @Get("/:id")
    public async get(@Res() res, @Param("id") id) {
        let obj;
        try {
            obj = await GoodsModels.findById(id)
                .populate("uploader")
                .populate("attributes")
                .populate("categroy")
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
