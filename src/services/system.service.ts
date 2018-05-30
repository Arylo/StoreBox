import { ObjectId } from "@models/common";
import { cache, ISystem, Model as SystemModel } from "@models/System";
import { Model as UsergroupsModel } from "@models/Usergroup";
import { BadRequestException, Component } from "@nestjs/common";
import { BaseService, IGetOptions } from "@services/base";
import readPkg = require("read-pkg");
import * as typescript from "typescript";
import { isURL } from "validator";

import { systemLogger } from "@utils/log";

export enum DEFAULTS {
    USERGROUP_FLAG = "DEFAULT_USERGROUP",
    GOOD_URL_FLAG = "DEFAULT_GOOD_URL",
    COLLECTION_URL_FLAG = "DEFAULT_COLLECTION_URL"
}

@Component()
export class SystemService extends BaseService<ISystem> {

    constructor() {
        super();
        super.setCache(cache);
        super.setModel(SystemModel);
    }

    private readonly DEFAULTS_MAPS = {
        [DEFAULTS.USERGROUP_FLAG]: {
            get: this.getDefaultUsergroup.name,
            set: this.setDefaultUsergroup.name
        },
        [DEFAULTS.GOOD_URL_FLAG]: {
            get: this.getDefaultGoodUrl.name,
            set: this.setDefaultGoodUrl.name
        },
        [DEFAULTS.COLLECTION_URL_FLAG]: {
            get: this.getDefaultCollectionUrl.name,
            set: this.setDefaultCollectionUrl.name
        }
    };

    private async checkUsergroupId(gid: ObjectId) {
        const doc = await UsergroupsModel.findById(gid).exec();
        /* istanbul ignore if */
        if (!doc) {
            throw new BadRequestException("The ID isnt a Usergroup ID");
        }
        return true;
    }

    private async checkUrl(url: string) {
        if (!isURL(url)) {
            throw new BadRequestException("URL Parse Fail");
        }
        return true;
    }

    private setValue(key: string, value: string) {
        try {
            return SystemModel.findOneAndUpdate(
                { key: key }, { value: value }, { upsert: true }
            ).exec();
        } catch (error) {
            throw new BadRequestException(error.toString());
        }
    }

    // region Default Usergroup ID
    /**
     * Get Default Usergroup ID
     * @returns Usergroup ID
     */
    public getDefaultUsergroup() {
        const FLAG = DEFAULTS.USERGROUP_FLAG;
        return this.loadAndCache(FLAG, async () => {
            const obj = await this.findObject({ key: FLAG });
            let gid = obj.value;
            /* istanbul ignore if */
            if (!gid) {
                systemLogger.warn(`Miss ${FLAG}`);
                gid = (await UsergroupsModel.findOne().exec())._id;
                this.setDefaultUsergroup(gid);
            }
            return gid;
        });
    }

    /**
     * Set Default Usergroup ID
     * @param gid Usergroup ID
     */
    public async setDefaultUsergroup(gid: ObjectId) {
        await this.checkUsergroupId(gid);
        return await this.setValue(DEFAULTS.USERGROUP_FLAG, gid.toString());
    }
    // endregion Default Usergroup ID

    // region Default Urls
    public getDefaultGoodUrl() {
        const FLAG = DEFAULTS.GOOD_URL_FLAG;
        return this.loadAndCache(FLAG, async () => {
            const obj = await this.findObject({ key: FLAG });
            return obj ? obj.value : "";
        });
    }

    public setDefaultGoodUrl(url: string) {
        if (url.length !== 0) {
            if (!url.includes("{{gid}}")) {
                throw new BadRequestException("Url must include `{{gid}}`");
            }
            this.checkUrl(url);
        }
        return this.setValue(DEFAULTS.GOOD_URL_FLAG, url);
    }

    public getDefaultCollectionUrl() {
        const FLAG = DEFAULTS.COLLECTION_URL_FLAG;
        return this.loadAndCache(FLAG, async () => {
            const obj = await this.findObject({ key: FLAG });
            return obj ? obj.value : "";
        });
    }

    public setDefaultCollectionUrl(url: string) {
        if (url.length !== 0) {
            if (!url.includes("{{cid}}")) {
                throw new BadRequestException("Url must include `{{cid}}`");
            }
            this.checkUrl(url);
        }
        return this.setValue(DEFAULTS.COLLECTION_URL_FLAG, url);
    }
    // endregion Default Urls

    public get() {
        return this.loadAndCache("get", async () => {
            const objs: Array<{ key: string, value: string }> =
                await this.findObjects({ }, { select: "key value -_id" });
            const keys = objs.reduce((arr, item) => {
                arr.push(item.key);
                return arr;
            }, [ ]);
            if (objs.length === Object.keys(DEFAULTS).length) {
                return objs;
            }
            for (const k of Object.keys(DEFAULTS)) {
                if (!!~keys.indexOf(DEFAULTS[k])) {
                    continue;
                }
                const key = DEFAULTS[k];
                objs.push({
                    key, value: await this[this.DEFAULTS_MAPS[key].get]()
                });
            }
            return objs;
        });
    }

    public set(key: DEFAULTS, value: any) {
        switch (key) {
            case DEFAULTS.USERGROUP_FLAG:
            return this[this.DEFAULTS_MAPS[key].set](value);
            case DEFAULTS.GOOD_URL_FLAG:
            return this[this.DEFAULTS_MAPS[key].set](value);
            case DEFAULTS.COLLECTION_URL_FLAG:
            return this[this.DEFAULTS_MAPS[key].set](value);
        }
        throw new BadRequestException("What do you want to set up");
    }

    public async info() {
        return {
            version: {
                typescript: typescript.version,
                api: readPkg.sync().version,
                node: process.versions
            },
            env: {
                system: process.env,
                service: await this.get()
            }
        };
    }

}
