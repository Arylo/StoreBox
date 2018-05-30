interface IServer {
    port: number;
}

interface IDb {
    type: string;
    host: string;
    database: string;
    salt: string;
    user?: string;
    pass?: string;
}

interface IPaths {
    tmp: string;
    upload: string;
    log: string;
    resource: string;
    backup: string;
}

interface IRedis {
    url: string;
}

interface IDefaults {
    user: IDefaultUser;
    group: IDefaultUsergroup;
}

interface IDefaultUser {
    name: string;
    pass: string;
}

interface IDefaultUsergroup {
    name: string;
}

export interface IConfigObj {
    redis: IRedis;
    server: IServer;
    db: IDb;
    paths: IPaths;
    defaults: IDefaults;
}
