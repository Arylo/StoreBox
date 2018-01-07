import * as mongoose from "mongoose";
import { isArray } from "util";
import { config } from "@utils/config";
import { Model as UsersModel } from "@models/User";
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
        }, (err) => {
            if (err) {
                return reject(err);
            }
            systemLogger.info("Connected Database.");
            UsersModel.count({ }).exec().then((num) => {
                if (num === 0) {
                    return UsersModel.addUser("root", "admin");
                }
            });
            return resolve(connection);
        });
    });
};

export const databaseProviders = [
    {
        provide: "DbConnectionToken",
        useFactory: connectDatabase
    }
];
