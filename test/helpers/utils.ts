export const sleep = (ms: number) => {
    return new Promise((reslove) => {
        setTimeout(reslove, ms);
    });
};
