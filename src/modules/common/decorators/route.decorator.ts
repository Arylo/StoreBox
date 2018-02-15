import { createRouteParamDecorator } from "@nestjs/common";

export const User = createRouteParamDecorator((data, req) => {
    return req.user;
});

export const File = createRouteParamDecorator((data, req) => {
    return req.file;
});

export const Files = createRouteParamDecorator((data, req) => {
    return req.files;
});
