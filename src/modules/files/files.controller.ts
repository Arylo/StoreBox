import {
    Controller, Get, Param, Req, Res, BadRequestException,
    NotFoundException, UseGuards, Query, HttpStatus, HttpCode
} from "@nestjs/common";
import { ApiUseTags, ApiImplicitParam, ApiOperation } from "@nestjs/swagger";
import { GoodDoc } from "@models/Good";
import { config } from "@utils/config";
import { Roles } from "@decorators/roles";
import { RolesGuard } from "@guards/roles";
import { ParseIntPipe } from "@pipes/parse-int";
import { GoodsService } from "@services/goods";

import { Response } from "express";
import pathExists = require("path-exists");
import fs = require("fs-extra");
import { DownlaodDto } from "./files.dto";

(async () => {
    if (!(await pathExists(config.paths.upload))) {
        fs.mkdirp(config.paths.upload);
    }
})();

@UseGuards(RolesGuard)
@Controller("files")
@ApiUseTags("Good Download")
export class FilesController {

    constructor(private readonly goodsSvr: GoodsService) { }

    @Roles("guest")
    @Get("/categories/:cid/goods/:id")
    // region Swagger Docs
    @ApiOperation({ title: "Download File" })
    @ApiImplicitParam({ name: "cid", description: "Category ID" })
    @ApiImplicitParam({ name: "id", description: "Good ID" })
    // endregion Swagger Docs
    public async downloadFile(
        @Req() req, @Res() res: Response, @Param() params: DownlaodDto
    ) {
        let obj: GoodDoc;
        try {
            obj = (await this.goodsSvr.get({
                _id: params.id, category: params.cid
            }))[0];
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
        if (!obj) {
            throw new NotFoundException();
        }

        const good = obj.toObject();
        const filepath = this.goodsSvr.getFilepath(good);

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
