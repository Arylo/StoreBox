import {
    Controller, Req, Res, Body, Get, Post, Param, Session,
    HttpStatus, BadRequestException, UseGuards, Delete, HttpCode, Query
} from "@nestjs/common";
import {
    ApiBearerAuth, ApiUseTags, ApiResponse, ApiOperation, ApiImplicitParam,
    ApiImplicitBody, ApiConsumes
} from "@nestjs/swagger";
import { IValues, Model as ValuesModel } from "@models/Value";
import { Model as GoodsModels, IGoods } from "@models/Good";
import { Model as RegexpModel } from "@models/Regexp";
import { Model as TokensModel } from "@models/Token";
import { Model as CollectionsModel } from "@models/Collection";
import { Model as CategroiesModel } from "@models/Categroy";
import { ObjectId } from "@models/common";
import { config } from "@utils/config";
import { RolesGuard } from "@guards/roles";
import { Roles } from "@decorators/roles";
import { File, Files, User } from "@decorators/route";
import { GidDto } from "@dtos/ids";
import { IReqUser } from "@dtos/req";
import { PerPageDto, ListResponse } from "@dtos/page";
import { RegexpCountCheckPipe } from "@pipes/regexp-count-check";
import { ParseIntPipe } from "@pipes/parse-int";
import { ToArrayPipe } from "@pipes/to-array";
import { TokensService } from "@services/tokens";
import { CollectionsService } from "@services/collections";
import { IGetRegexpsOptions, RegexpsService } from "@services/regexps";
import { CategoriesService } from "@services/categories";
import * as hasha from "hasha";
import fs = require("fs-extra");
import multer  = require("multer");
import { isArray } from "util";

import { CreateValueDto, EditValueDto } from "../values/values.dto";
import { GoodAttributeParamDto, UploadQueryDto } from "./goods.dto";

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
        private readonly categoriesSvr: CategoriesService
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
    public async getGoods(@Query(new ParseIntPipe()) query: PerPageDto) {
        const curPage = query.page || 1;
        const totalPages =
            await GoodsModels.countGoodsByUids([ ], query.perNum);
        const totalCount = await GoodsModels.countGoodsByUids([ ]);

        const resData = new ListResponse();
        resData.current = curPage;
        resData.totalPages = totalPages;
        resData.total = totalCount;
        if (totalPages >= curPage) {
            resData.data = await GoodsModels.getGoodsByUids(
                [ ], query.perNum, query.page
            );
        }
        return resData;
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
        const categories = await CategroiesModel.find(conditions).exec();
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
            goodObj = (await GoodsModels.create({
                filename: obj.file.filename,
                originname: obj.file.originalname,
                category: categories[0]._id,
                uploader: obj.uploader, md5sum, sha256sum,
                active: true
            })).toObject();
        } catch (error) {
            if (cb) {
                cb("Good", error);
            }
            return;
        }
        const newFilePath =
            `${config.paths.upload}/${categories[0]._id}/${obj.file.filename}`;
        fs.move(obj.file.path, newFilePath);
        return goodObj;
    }

    @Roles("admin", "token")
    @Post()
    // region Swagger Docs
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ title: "上传单个文件" })
    @ApiConsumes("multipart/form-data")
    @ApiImplicitBody({
        name: "file", type: String, description: "File"
    })
    // endregion Swagger Docs
    public async addGood(
        @File(new RegexpCountCheckPipe()) file: Express.Multer.File,
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

        return await this.fileProcess(
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
                    throw new BadRequestException(error.toString());
                }
            }
        );
    }

    @Roles("admin", "token")
    @Post("/collections")
    // region Swagger Docs
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ title: "上传多个文件并形成文件集" })
    @ApiConsumes("multipart/form-data")
    @ApiImplicitBody({
        name: "files", type: String, description: "Files"
    })
    // endregion Swagger Docs
    public async addGoods(
        @Files(new RegexpCountCheckPipe()) files: Express.Multer.File[],
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
            try {
                const collections = await this.collectionsSvr.create({
                    goods: goods.reduce((arr, good) => {
                        arr.push(good._id);
                        return arr;
                    }, []),
                    creator: uploaderId
                });
                const collection =
                    isArray(collections) ? collections[0] : collections;
                return CollectionsModel
                    .findById(collection._id)
                    .populate("goods")
                    .exec();
            } catch (error) {
                throw new BadRequestException(error.toString());
            }
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
