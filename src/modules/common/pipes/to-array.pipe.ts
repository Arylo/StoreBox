import { ArgumentMetadata, Pipe, PipeTransform } from "@nestjs/common";
import { isArray, isObject } from "util";

@Pipe()
export class ToArrayPipe implements PipeTransform<any> {

    private readonly properties: string[];
    constructor(...properties: string[]) {
        this.properties = properties;
    }

    public transform(value: any, metadata: ArgumentMetadata) {
        if (!value || isArray(value)) {
            return value;
        }
        if (!isObject(value)) {
            return [ value ];
        }
        if (this.properties.length === 0) {
            for (const key of Object.keys(value)) {
                if (isArray(value[key])) {
                    continue;
                }
                value[key] = [ value[key] ];
            }
        } else {
            for (const property of this.properties) {
                const val = value[property];
                if (!val || isArray(val)) {
                    continue;
                }
                value[property] = [ val ];
            }
        }
        return value;
    }
}
