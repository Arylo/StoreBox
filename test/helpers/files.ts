import supertest = require("supertest");

export const uploadFile = (
    request: supertest.SuperTest<supertest.Test>, filepath: string
) => {
    return request.post("/api/v1/goods")
        .attach("file", filepath)
        .then();
};

export const uploadFiles = (
    request: supertest.SuperTest<supertest.Test>, filepaths: string[]
) => {
    let req = request.post("/api/v1/goods/collections");
    filepaths.forEach((filepath) => {
        req = req.attach("files", filepath);
    });
    return req.then();
};
