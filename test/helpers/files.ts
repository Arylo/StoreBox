import supertest = require("supertest");

export const uploadFile = (
    request: supertest.SuperTest<supertest.Test>, filepath: string
) => {
    return request.post("/api/v1/goods")
        .attach("file", filepath)
        .then();
};
