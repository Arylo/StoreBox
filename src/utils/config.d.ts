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

export interface ConfigObj {
    server: server;
    db: db;
    paths: paths;
}