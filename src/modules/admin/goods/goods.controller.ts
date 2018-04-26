import {
    Controller, Req, Res, Body, Get, Post, Param, Session,
    HttpStatus, BadRequestException, UseGuards, Delete, HttpCode, Query, Put,
    UploadedFile, UploadedFiles, UsePipes, UseInterceptors
} from "@nestjs/common";
import {
    ApiBearerAuth, ApiUseTags, ApiResponse, ApiOperation, ApiImplicitParam,
    ApiImplicitBody, ApiConsumes
} from "@nestjs/swagger";
import { IValues, Model as ValuesModel } from "@models/Value";
import { IGoods } from "@models/Good";
import { ObjectId } from "@models/common";
import { config } from "@utils/config";
import { RolesGuard } from "@guards/roles";
import { Roles } from "@decorators/roles";
import { User } from "@decorators/route";
import { GidDto } from "@dtos/ids";
import { IReqUser } from "@dtos/req";
import { ListResponse } from "@dtos/page";
import { DefResDto } from "@dtos/res";
import { CreateValueDto, EditValueDto } from "@dtos/values";
import { ParseIntPipe } from "@pipes/parse-int";
import { ToArrayPipe } from "@pipes/to-array";
import { TokensService } from "@services/tokens";
import { CollectionsService } from "@services/collections";
import { IGetRegexpsOptions, RegexpsService } from "@services/regexps";
import { CategoriesService } from "@services/categories";
import { GoodsService } from "@services/goods";
import { UtilService } from "@services/util";
import * as hasha from "hasha";
import fs = require("fs-extra");
import multer  = require("multer");
import { isArray } from "util";

import {
    GoodAttributeParamDto, UploadQueryDto, EditBodyDto, GetGoodsDto
} from "./goods.dto";
import { RegexpCountCheckInterceptor } from "@interceptors/regexp-count-check";
import { LogsService } from "@services/logs";

@UseGuards(RolesGuard)
@Controller("api/v1/goods")
@ApiUseTags("goods")
@ApiBearerAuth()
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
export class GoodsAdminController {

    constructor(
        private readonly tokensSvr: TokensService,
        private readonly collectionsSvr: CollectionsService,
        private readonly regexpSvr: RegexpsService,
        private readonly categoriesSvr: CategoriesService,
        private readonly goodsSvr: GoodsService,
        private readonly logsSvr: LogsService
    ) { }

    private toMd5sum(filepath: string) {
        return  hasha.fromFileSync(filepath, { algorithm: "md5" });
    }

    private toSha256sum(filepath: string) {
        return  hasha.fromFileSync(filepath, { algorithm: "sha256" });
    }

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
    public async getGoods(
        @Query(new ParseIntPipe()) query: GetGoodsDto
    ) {
        let arr: any[], total: number;
        if (query.cid) {
            arr = await this.goodsSvr.listByCategoryId(query.cid, query);
            total = await this.goodsSvr.countByCids(query.cid);
        } else {
            arr = await this.goodsSvr.getByUids([ ], query);
            total = await this.goodsSvr.countByUids([ ]);
        }
        for (let i = 0; i < arr.length; i++) {
            const good = arr[i];
            good.downloaded =
                await this.logsSvr.goodDownloadCount(good._id);
            arr[i] = good;
        }
        return UtilService.toListRespone(arr, Object.assign({ total }, query));
    }

    private async getCategoriesIds(names: string[]) {
        if (names.length === 0) {
            return [ ];
        }
        const conditions = {
            $or: names.reduce((arr: any[], item) => {
                arr.push({ name: item });
                return arr;
            }, [ ])
        };
        const categories = await this.categoriesSvr.get(conditions);
        const idSet = new Set<ObjectId>();
        for (const category of categories) {
            const id = category._id.toString();
            idSet.add(id);
            const ids = await this.categoriesSvr.getChildrenIds(id);
            for (const id of ids) {
                idSet.add(id.toString());
            }
        }
        return Array.from(idSet);
    }

    /**
     * 文件处理
     */
    private async fileProcess(
        obj: {
            file: Express.Multer.File, uploader: string,
            opt?: IGetRegexpsOptions
        },
        cb?: (type: "Categories" | "Good", error) => void
    ) {
        const categories = await this.regexpSvr.discern(
            obj.file.originalname, obj.opt
        );
        if (categories.length !== 1) {
            fs.remove(obj.file.path);
            if (cb) {
                cb("Categories", categories.length);
            }
            return;
        }
        let goodObj: IGoods;
        try {
            const md5sum = this.toMd5sum(obj.file.path);
            const sha256sum = this.toSha256sum(obj.file.path);
            goodObj = (await this.goodsSvr.add({
                filename: obj.file.filename,
                originname: obj.file.originalname,
                category: categories[0]._id,
                uploader: obj.uploader, md5sum, sha256sum,
                active: true
            })).toObject();
        } catch (error) {
            fs.remove(obj.file.path);
            if (cb) {
                cb("Good", error);
            } else {
                throw error;
            }
        }
        const newFilePath =
            `${config.paths.upload}/${categories[0]._id}/${obj.file.filename}`;
        fs.move(obj.file.path, newFilePath);
        return goodObj;
    }

    @Roles("admin", "token")
    @Post()
    @UseInterceptors(RegexpCountCheckInterceptor)
    // region Swagger Docs
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ title: "上传单个文件" })
    @ApiConsumes("multipart/form-data")
    @ApiImplicitBody({
        name: "file", type: String, description: "File"
    })
    // endregion Swagger Docs
    public async addGood(
        @UploadedFile() file: Express.Multer.File,
        @User() user: IReqUser, @Session() session,
        @Query(new ToArrayPipe()) query: UploadQueryDto
    ) {
        const uploaderId = session.loginUserId ||
            await this.tokensSvr.getIdByToken(user.token);
        const fileProcessOpts = {
            categroies:
                await this.getCategoriesIds(query.category || []),
            appends: await this.getCategoriesIds(query.append || [])
        };

        return this.fileProcess(
            { file, uploader: uploaderId, opt: fileProcessOpts },
            (type, error) => {
                if (type === "Categories") {
                    if (error === 0) {
                        throw new BadRequestException("Lost Role for the file");
                    } else {
                        throw new BadRequestException("Much Role for the file");
                    }
                }
                if (type === "Good") {
                    throw error;
                }
            }
        );
    }

    @Roles("admin", "token")
    @Post("/collections")
    @UseInterceptors(RegexpCountCheckInterceptor)
    // region Swagger Docs
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ title: "上传多个文件并形成文件集" })
    @ApiConsumes("multipart/form-data")
    @ApiImplicitBody({
        name: "files", type: String, description: "Files"
    })
    // endregion Swagger Docs
    public async addGoods(
        @UploadedFiles() files: Express.Multer.File[],
        @User() user: IReqUser, @Session() session,
        @Query(new ToArrayPipe()) query: UploadQueryDto
    ) {
        const uploaderId = session.loginUserId ||
            await this.tokensSvr.getIdByToken(user.token);
        const fileProcessOpts = {
            categroies:
                await this.getCategoriesIds(query.category || []),
            appends: await this.getCategoriesIds(query.append || [])
        };

        const goods: IGoods[] = [ ];
        for (const file of files) {
            const goodObj = await this.fileProcess({
                file, uploader: uploaderId, opt: fileProcessOpts
            });
            if (!goodObj) {
                fs.remove(file.path);
                continue;
            }
            goods.push(goodObj);
        }
        if (goods.length === 0) {
            throw new BadRequestException("The Collection no good");
        } else {
            const collections = await this.collectionsSvr.create({
                goods: goods.reduce((arr, good) => {
                    arr.push(good._id);
                    return arr;
                }, []),
                creator: uploaderId
            });
            const collection =
                isArray(collections) ? collections[0] : collections;
            return this.collectionsSvr.getObjectById(collection._id, {
                populate: [ "goods" ]
            });
        }
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
            obj = await this.goodsSvr.getObjectById(param.gid, {
                populate: [
                    "attributes",
                    { path: "uploader", select: "nickname" },
                    { path: "category", select: "name attributes tags" }
                ]
            });
            obj.downloaded = await this.logsSvr.goodDownloadCount(param.gid);
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
        const obj = await this.goodsSvr.getById(param.gid, {
            populate: [ "attributes" ]
        });
        if (!obj) {
            throw new BadRequestException("Non Exist Good");
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
        await this.goodsSvr.editById(
            param.gid, { $push: { attributes: newAttr._id } }
        );
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
        return new DefResDto();
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
        await this.goodsSvr.editById(param.gid, {
            $pull: { attributes: param.aid}
        });
        try {
            await ValuesModel.findByIdAndRemove(param.aid).exec();
        } catch (error) {
            await this.goodsSvr.editById(
                param.gid, { $push: { attributes: param.aid } }
            );
            throw new BadRequestException(error.toString());
        }
        return new DefResDto();
    }

    @Roles("admin")
    @Put("/:gid")
    @Delete("/:gid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Modify Good" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Modify Success"
    })
    // endregion Swagger Docs
    public async edit(@Param() param: GidDto, @Body() body: EditBodyDto) {
        await this.goodsSvr.editById(param.gid, body);
        return new DefResDto();
    }

    @Roles("admin")
    @Delete("/:gid")
    // region Swagger Docs
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ title: "Delete Good" })
    @ApiResponse({
        status: HttpStatus.OK, description: "Delete Success"
    })
    // endregion Swagger Docs
    public async delete(@Param() param: GidDto) {
        await this.goodsSvr.remove(param.gid);
        return new DefResDto();
    }

}
