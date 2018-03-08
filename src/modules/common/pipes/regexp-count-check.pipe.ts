import {
    Pipe, PipeTransform, ArgumentMetadata, BadRequestException
} from "@nestjs/common";
import { isArray } from "util";
import fs = require("fs-extra");
import { RegexpsService } from "@services/regexps";

type File = Express.Multer.File;

@Pipe()
export class RegexpCountCheckPipe implements PipeTransform<File | File[]> {

    private readonly regexpSvr = new RegexpsService();

    public async transform(value: File | File[], metadata: ArgumentMetadata) {
        const regexpCount = await this.regexpSvr.count();
        if (regexpCount !== 0) {
            return value;
        }
        if (!value) {
            return value;
        }
        if (isArray(value)) {
            for (const val of value) {
                fs.remove(val.path);
            }
        } else {
            fs.remove(value.path);
        }
        throw new BadRequestException("Lost The Good Role");
    }
}
