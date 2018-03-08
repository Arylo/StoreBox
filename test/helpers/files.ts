import supertest = require("supertest");
import { config } from "@utils/config";
import { isArray } from "util";
import faker = require("faker");
import fs = require("fs-extra");
import { sleep } from "./utils";

interface IUploadFileOptions {
    query?: {
        [key: string]: string
    };
}

/* tslint:disable:no-empty-interface */
interface IUploadFilesOptions extends IUploadFileOptions { }

const addQuery = (url: string, opts: IUploadFileOptions) => {
    if (opts.query && Object.keys(opts.query).length > 0) {
        const query = [ ];
        for (const key of Object.keys(opts.query)) {
            const q = opts.query[key].split(/\s+/).map((val) => {
                return `${key}=${val}`;
            }).join("&");
            query.push(q);
        }
        url += `?${query.join("&")}`;
    }
    return url;
};

export const uploadFile = (
    request: supertest.SuperTest<supertest.Test>, filepath: string,
    opts: IUploadFileOptions = { }
) => {
    let url = "/api/v1/goods";
    url = addQuery(url, opts);

    return request.post(url).attach("file", filepath)
        .then();
};

export const uploadFiles = (
    request: supertest.SuperTest<supertest.Test>, filepaths: string[],
    opts: IUploadFilesOptions = { }
) => {
    let url = "/api/v1/goods/collections";
    url = addQuery(url, opts);

    let req = request.post(url);
    filepaths.forEach((filepath) => {
        req = req.attach("files", filepath);
    });
    return req.then();
};

const newFilename = () => {
    const name = `${faker.random.word()}_${faker.random.uuid()}`;
    const random = Math.random();
    const randomStr = `${random}`.replace(/(^0|\D)/g, "");
    return `${randomStr}-${name}`;
};

/**
 * Generate File
 * @param filename
 * @returns filepath
 */
export const newFile = (filename = newFilename()) => {
    const folderpath = `${config.paths.tmp}/test`;
    if (!fs.existsSync(folderpath)) {
        fs.mkdirpSync(folderpath);
    }
    const filepath = `${folderpath}/${filename}`;
    fs.writeFileSync(filepath, JSON.stringify({
        data: Math.random()
    }), { encoding: "utf-8" });
    return filepath;
};

export const remove = (filepaths: string[] | string) => {
    if (!isArray(filepaths)) {
        filepaths = [ filepaths ];
    }
    if (filepaths.length === 0) {
        return Promise.resolve();
    }
    return Promise.all(filepaths.map(async (filepath) => {
        await sleep(200);
        return fs.existsSync(filepath) ? fs.remove(filepath) : null;
    }));
};
