import { IRegexpDoc } from "@models/Regexp";
import { RegexpsService } from "@services/regexps";

let regexpSvr: RegexpsService;

const init = () => {
    if (!regexpSvr) {
        regexpSvr = new RegexpsService();
    }
    return regexpSvr;
};

export const newRegexp = (obj: IRegexpDoc) => {
    init();
    return regexpSvr.create(obj);
};
