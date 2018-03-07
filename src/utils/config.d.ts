interface server {
    port: number;
}

interface db {
    type: string;
    host: string;
    database: string;
    salt: string;
    user?: string;
    pass?: string;
}

interface paths {
    tmp: string;
    upload: string;
    log: string;
    resource: string;
    backup: string;
}

interface redis {
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

export interface ConfigObj {
    redis: redis;
    server: server;
    db: db;
    paths: paths;
    defaults: IDefaults;
}
