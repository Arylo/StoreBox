import * as mongoose from "mongoose";
import { isArray } from "util";
import { config } from "@utils/config";
import { Model as UsersModel } from "@models/User";

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

export const connectDatabase = async (): Promise<mongoose.Connection> => {
    (mongoose as any).Promise = global.Promise;
    const connection = await mongoose.connect(getDatabaseUrl(), {
        useMongoClient: true,
    });
    UsersModel.count({ }).exec().then((num) => {
        if (num === 0) {
            return UsersModel.addUser("root", "admin");
        }
    });
    return connection;
};

export const databaseProviders = [
    {
        provide: "DbConnectionToken",
        useFactory: connectDatabase
    }
];
