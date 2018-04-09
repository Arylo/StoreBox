import path = require("path");
import supertest = require("supertest");
import auth = require("@db/auth");
import { IIds, addCategoryAndRegexp } from "./database";
import { newUser } from "@db/user";
import { Model as TokensModel } from "@models/Token";
import { Model as CategoriesModel } from "@models/Categroy";
import { isNumber } from "util";
import { newName, sleep } from "./utils";
import {
    IUploadFileOptions, addQuery, IUploadFilesOptions, newFile
} from "./files";
import { ObjectId } from "@models/common";
import { LogsService } from "@services/logs";
import { Model as LogsModel } from "@models/Log";
import { addCategories } from "@db/categories";

type ST = supertest.SuperTest<supertest.Test>;

class BaseRequest {

    constructor(
        protected readonly req: ST,
        protected readonly ids: IIds,
        protected readonly filepaths: string[] = [ ]
    ) { }

    public get(url: string, callback?) {
        return this.req.get(url, callback);
    }

    public post(url: string, callback?) {
        return this.req.post(url, callback);
    }

    public put(url: string, callback?) {
        return this.req.put(url, callback);
    }

    public delete(url: string, callback?) {
        return this.req.delete(url, callback);
    }

    public getIds() {
        return this.ids;
    }

    public getFilepaths() {
        return this.filepaths;
    }

    protected users = [ ];

    public async newUser(username = newName(), password = newName()) {
        const user = await newUser(username, password);
        this.users.push({ username, password });
        this.ids.users.push(user._id);
        return this;
    }

    protected newFilepaths: string[] = [ ];

    public async newFile(filename?: string) {
        const filepath = await newFile(filename);
        this.filepaths.push(filepath);
        this.newFilepaths.push(filepath);
        return this;
    }

    /**
     * New A Category And add a regexp to it
     * @param regexp It will new one file and filename will as the regexp value if non-exist value
     * @param pid Parent Category ID
     */
    public async addCategoryWithRegexp(regexp?: RegExp, pid?: ObjectId) {
        if (!regexp) {
            if (this.newFilepaths.length === 0) {
                throw new TypeError("No New File");
            }
            // await this.newFile();
            const filepath = this.newFilepaths[this.newFilepaths.length - 1];
            const filename = path.basename(filepath);
            regexp = new RegExp(`^${filename}$`);
        }
        const docs = await addCategoryAndRegexp(regexp, pid);
        this.ids.categories.push(docs[0]._id);
        this.ids.regexps.push(docs[1]._id);
        return this;
    }

    public async downloadFile(cid: ObjectId, gid: ObjectId, opts?) {
        const url =
            `/files/categories/${cid.toString()}/goods/${gid.toString()}`;
        const ref = await Object.keys(opts || { }).reduce((req, key) => {
            req = req[key](opts[key]);
            return req;
        }, this.get(url)).then();
        const key = `good_${gid.toString()}`;
        this.ids.logs.push(
            ...(await LogsModel.find({ key }).exec()).map((log) => log._id)
        );
        return ref;
    }

    public async addCategory(pid?: ObjectId) {
        const ctx: any = {
            name: newName()
        };
        if (pid) {
            ctx.pid = pid;
        }
        const result = await CategoriesModel.create(ctx);
        this.ids.categories.push(result._id);
        return this;
    }

    /**
     * Add 11 Categories
     * ```
     *          - 1 - 4
     *          |
     *      - 0 - 2 - 5 - 6 - 8
     *      |   |       |
     * pid -|   - 3     - 7
     *      |
     *      - 9 - 10
     * ```
     * @param pid Parent Category ID
     */
    public async addCategories(pid?: ObjectId) {
        const ids = await addCategories(pid);
        this.ids.categories.push(...ids);
        return this;
    }

}

export class GuestRequest extends BaseRequest {

    public async login(
        username?: string | number, password?: string
    ): Promise<AdminRequest> {
        const index = isNumber(username) ? username : -1;
        if (index !== -1 && (this.users.length - 1 >= index)) {
            const user = this.users[0];
            await this.req.post("/api/v1/auth/login").send(user).then();
        } else {
            const req = await this.newUser(username + "", password);
            return req.login(this.users.length - 1);
        }
        return new AdminRequest(this.req, this.ids, this.filepaths);
    }

    public async loginWithToken(
        username?: string | number, password?: string
    ): Promise<TokenRequest> {
        const index = isNumber(username) ? username : -1;
        if (index !== -1 && (this.users.length - 1 >= index)) {
            const user = this.users[0];
            const { body } =
                await this.req.post("/api/v1/auth/login?token=true")
                .send(user).then();
            const token =
                await TokensModel.findOne({ token: body.token }).exec();
            this.ids.tokens.push(token._id);
            return new TokenRequest(
                this.req, user.username, body.token, this.ids, this.filepaths
            );
        } else {
            return (await this.newUser()).loginWithToken(this.users.length - 1);
        }
    }

}

class LoginedRequest extends BaseRequest {

    public async logout() {
        await this.get("/api/v1/auth/logout").then();
        return new GuestRequest(this.req, this.ids, this.filepaths);
    }

    /**
     * Upload File to StoreBox
     * @param filepath if filepath is empty value, it will upload last new file. if havnt new-file, will genertor one.
     */
    public async uploadFile(filepath?: string, opts: IUploadFileOptions = { }) {
        let url = "/api/v1/goods";
        url = addQuery(url, opts);

        if (!filepath) {
            if (this.filepaths.length === 0) {
                await this.newFile();
            }
            filepath = this.newFilepaths[this.newFilepaths.length - 1];
        } else if (this.filepaths.indexOf(filepath) > -1) {
            this.filepaths.push(filepath);
        }

        return this.post(url).attach("file", filepath).then((ref) => {
            const { status, body } = ref;
            if (status === 201 ) {
                this.ids.goods.push(body._id);
            }
            return ref;
        });
    }

    public async uploadFiles(
        filepaths: string[], opts: IUploadFilesOptions = { }
    ) {
        let url = "/api/v1/goods/collections";
        url = addQuery(url, opts);

        let req = this.post(url);
        filepaths.forEach((filepath) => {
            if (this.filepaths.indexOf(filepath) > -1) {
                this.filepaths.push(filepath);
            }
            req = req.attach("files", filepath);
        });
        return req.then().then((ref) => {
            const { status, body } = ref;

            if (status === 201 ) {
                body.goods.forEach((good) => {
                    this.ids.goods.push(good._id);
                });
                this.ids.collections.push(body._id);
            }
            return ref;
        });
    }
}

export class AdminRequest extends LoginedRequest {

    public async addCollection(goods: ObjectId[], name = newName()) {
        goods = goods.map((item) => item.toString());
        const { status, body } = await this.post("/api/v1/collections")
            .send({ name, goods }).then();
        if (status === 201) {
            this.ids.collections.push(body._id);
        }
        status.should.be.eql(201);
        await sleep(200);
        return this;
    }

    public async addTagGroup(name = newName(), tags: string[] = [ ]) {
        const { status, body } = await this.post("/api/v1/tags")
            .send({ name, tags }).then();
        status.should.be.eql(201);
        if (status === 201) {
            this.ids.tags.push(body._id);
        }
        return this;
    }

}

export class TokenRequest extends LoginedRequest {

    private readonly auth;

    constructor(
        req: ST, username: string, token: string,
        ids: IIds, filepaths?: string[]
    ) {
        super(req, ids, filepaths);
        this.auth = { username, token };
    }

    public get(url: string, callback?) {
        return super.get(url, callback)
            .auth(this.auth.username, this.auth.token);
    }

    public post(url: string, callback?) {
        return super.post(url, callback)
            .auth(this.auth.username, this.auth.token);
    }

    public put(url: string, callback?) {
        return super.put(url, callback)
            .auth(this.auth.username, this.auth.token);
    }

    public delete(url: string, callback?) {
        return super.delete(url, callback)
            .auth(this.auth.username, this.auth.token);
    }

}
