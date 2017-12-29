import supertest = require("supertest");

export const uploadFile = async (
    request: supertest.SuperTest<supertest.Test>, filepath: string
) => {
    return await request.post("/goods")
        .attach("file", filepath)
        .then();
};
