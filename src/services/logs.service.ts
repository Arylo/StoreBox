import { Component } from "@nestjs/common";
import { BaseService } from "@services/base";
import { Model as LogsModel, cache } from "@models/Log";
import { ObjectId } from "@models/common";
import { getMeta } from "@utils/log";

@Component()
export class LogsService extends BaseService {

    constructor() {
        super();
        this.setCache(cache);
        this.setModel(LogsModel);
    }

    public stepGoodDownloadCount(gid: ObjectId, req) {
        const key = `good_${gid.toString()}`;
        const meta = getMeta(null, req);
        return this.create({
            key, type: "download", ua: JSON.stringify(meta.ua), ipaddr: meta.ip
        });
    }

    public async goodDownloadCount(gid: ObjectId) {
        const flag = `good_download_${gid.toString()}`;
        const key = `good_${gid.toString()}`;

        return await this.loadAndCache(flag, () => {
            return this.total({ key, type: "download" });
        } , 60 * 1000 /* 1 min */);
    }

    public async goodsDownloadCount() {
        const flag = "goods_download";

        return await this.loadAndCache(flag, () => {
            return this.total({ key: /^good_/i , type: "download" });
        } , 2 * 60 * 1000 /* 2 min */);
    }

}
