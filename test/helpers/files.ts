import ST = require("supertest");

export const uploadFile = async (
    request: ST.SuperTest<ST.Test>, filepath: string
) => {
    return await request.post("/goods")
        .attach("file", filepath)
        .then();
};
