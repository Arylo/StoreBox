import * as mongoose from "mongoose";
import { isArray } from "util";
import { config } from "@utils/config";
import { Model as UsersModel } from "@models/User";

let isConnect = false;
(mongoose.Promise as any) = global.Promise;

export const connect = () => {
    if (isConnect) {
        return;
    }
    let host: string[] = [ ];
    if (!isArray(config.db.host)) {
        host = [ config.db.host ];
    }
    let dbHost = host.join(",");
    if (config.db.user && config.db.pass) {
        dbHost = `${config.db.user}:${config.db.pass}@${host}`;
    }
    const mongodbUrl = `mongodb://${dbHost}/${config.db.database}`;
    return mongoose.connect(mongodbUrl, {
        useMongoClient: true
    }, (err) => {
        if (err) {
            isConnect = false;
            throw err.message;
        }
        isConnect = true;
        UsersModel.count({ }).exec().then((num) => {
            if (num === 0) {
                return UsersModel.addUser("root", "admin");
            }
        });
    });
};

export const disconnect = () => {
    if (!isConnect) {
        return;
    }
    return mongoose.disconnect();
};
