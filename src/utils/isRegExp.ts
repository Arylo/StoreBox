export = (pattern: string | RegExp) => {
    try {
        const reg = new RegExp(pattern);
    } catch (error) {
        return false;
    }
    return true;
};
