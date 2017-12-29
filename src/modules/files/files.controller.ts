import {
    Controller, Get, Param, HttpException, HttpStatus, Req, Res
} from "@nestjs/common";
import { Model as GoodsModels, GoodDoc } from "@models/Good";
import { config } from "@utils/config";
import { Response } from "express";
import { DownlaodDto } from "./files.dto";

@Controller("files")
export class FilesController {

    @Get("/:cid/:id")
    public async downloadFile(
        @Req() req, @Res() res: Response, @Param() params: DownlaodDto
    ) {
        let obj: GoodDoc;
        try {
            obj = await GoodsModels
                .findOne({_id: params.id, categroy: params.cid})
                .exec();
        } catch (error) {
            throw new HttpException(error.toString(), HttpStatus.BAD_REQUEST);
        }
        if (!obj) {
            return res.status(HttpStatus.NOT_FOUND).end();
        }

        const good = obj.toObject();
        const filepath =
            `${config.paths.upload}/${params.cid}/${good.filename}`;
        if (!good.active) {
            throw new HttpException(
                "The File disallow download", HttpStatus.BAD_REQUEST
            );
        }
        res.download(filepath, good.originname);
    }
}
