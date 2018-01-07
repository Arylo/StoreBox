import {
    Controller, Get, Param, Req, Res, BadRequestException,
    NotFoundException
} from "@nestjs/common";
import { Model as GoodsModels, GoodDoc } from "@models/Good";
import { config } from "@utils/config";
import { Response } from "express";
import pathExists = require("path-exists");
import fs = require("fs-extra");
import { DownlaodDto } from "./files.dto";

(async () => {
    if (!(await pathExists(config.paths.upload))) {
        fs.mkdirp(config.paths.upload);
    }
})();

@Controller("files")
export class FilesController {

    @Get("/categories/:cid/goods/:id")
    public async downloadFile(
        @Req() req, @Res() res: Response, @Param() params: DownlaodDto
    ) {
        let obj: GoodDoc;
        try {
            obj = await GoodsModels
                .findOne({_id: params.id, categroy: params.cid})
                .exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        if (!obj) {
            throw new NotFoundException();
        }

        const good = obj.toObject();
        const filepath =
            `${config.paths.upload}/${params.cid}/${good.filename}`;

        if (!good.active) {
            throw new BadRequestException("Disallow download the File");
        }
        res.download(filepath, good.originname, (err) => {
            if (err) {
                // Recode Error
            }
        });
    }
}
