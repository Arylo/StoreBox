import * as mongoose from "mongoose";
import { isArray } from "util";
import { config } from "@utils/config";
import { Model as UsersModel } from "@models/User";
import { Model as UsergroupsModel } from "@models/Usergroup";
import { Model as UserUsergroupsModel } from "@models/User-Usergroup";
import { Model as SystemModel } from "@models/System";
import { SystemService } from "@services/system";
import { systemLogger } from "../common/helper/log";

const getDatabaseUrl = () => {
    let host: string[] = [ ];
    if (!isArray(config.db.host)) {
        host = [ config.db.host ];
    }
    let dbHost = host.join(",");
    if (config.db.user && config.db.pass) {
        dbHost = `${config.db.user}:${config.db.pass}@${host}`;
    }
    return `mongodb://${dbHost}/${config.db.database}`;
};

export const connectDatabase = () => {
    (mongoose as any).Promise = global.Promise;
    return new Promise((resolve, reject) => {
        const connection = mongoose.connect(getDatabaseUrl(), {
            useMongoClient: true,
        }, async (err) => {
            if (err) {
                return reject(err);
            }
            systemLogger.info("Connected Database.");
            await injectData();
            return resolve(connection);
        });
    });
};

export const injectData = async () => {
    let num = await UsersModel.count({ }).exec();
    if (num === 0) {
        return UsersModel.addUser("root", "admin");
    }
    num = await UsergroupsModel.count({ }).exec();
    if (num === 0) {
        const group = await UsergroupsModel.create({ name: "admin" });
        const conditions = (await UsersModel.find({ }).exec())
            .map((item) => {
                return {
                    user: item._id,
                    usergroup: group._id
                };
            });
        await SystemModel.findOneAndUpdate(
            { key: SystemService.DEFAULT_USERGROUP_FLAG },
            { value: group._id.toString() }, { upsert: true }
        ).exec();
        await UserUsergroupsModel.create(conditions);
    }
};

export const databaseProviders = [
    {
        provide: "DbConnectionToken",
        useFactory: connectDatabase
    }
];
