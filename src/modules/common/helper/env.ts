export const isTest = (() => {
    return "test" === process.env.NODE_ENV;
})();

export const isDevelopment = (() => {
    return "development" === process.env.NODE_ENV;
})();

export const isDebug = (() => {
    return isDevelopment || isTest;
})();
