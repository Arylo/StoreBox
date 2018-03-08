import { Pipe, PipeTransform, ArgumentMetadata } from "@nestjs/common";
import { isObject, isArray } from "util";

@Pipe()
export class ToArrayPipe implements PipeTransform<any> {

    private readonly properties: string[];
    constructor(...properties: string[]) {
        this.properties = properties;
    }

    public async transform(value: any, metadata: ArgumentMetadata) {
        if (!value || isArray(value)) {
            return value;
        }
        if (this.properties.length === 0) {
            if (isObject(value)) {
                for (const key of Object.keys(value)) {
                    value[key] = [ value[key] ];
                }
            } else {
                return [ value ];
            }
        } else {
            for (const property of this.properties) {
                if (!value[property] || isArray(value[property])) {
                    continue;
                }
                value[property] = [ value[property] ];
            }
        }
        return value;
    }
}
