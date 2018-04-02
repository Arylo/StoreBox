import { Interceptor, NestInterceptor, BadRequestException } from "@nestjs/common";
import { Observable } from "rxjs/Observable";
import { RegexpsService } from "@services/regexps";
import * as fs from "fs-extra";

@Interceptor()
export class RegexpCountCheckInterceptor implements NestInterceptor {

    constructor(private readonly regexpsSvr: RegexpsService) { }

    public async intercept(
        dataOrRequest, context, stream$: Observable<any>
    ) {
        const regexpCount = await this.regexpsSvr.count();
        if (regexpCount !== 0) {
            return stream$;
        }
        const files = dataOrRequest.file ?
            [ dataOrRequest.file ] : dataOrRequest.files;
        for (const val of files) {
            fs.remove(val.path);
        }
        throw new BadRequestException("Lost The Good Role");
    }
}
