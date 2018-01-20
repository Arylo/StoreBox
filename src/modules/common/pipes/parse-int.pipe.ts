import { HttpException } from "@nestjs/common";
import {
    PipeTransform, Pipe, ArgumentMetadata, HttpStatus
} from "@nestjs/common";

@Pipe()
export class ParseIntPipe implements PipeTransform<string> {
    public async transform(value: object | string, metadata: ArgumentMetadata) {
        if (typeof(value) === "object") {
            for (const key of Object.keys(value)) {
                value[key] = parseInt(value[key], 10);
                if (isNaN(value[key])) {
                    throw new HttpException(
                        "Validation failed", HttpStatus.BAD_REQUEST
                    );
                }
            }
            return value;
        } else {
            const val = parseInt(value, 10);
            if (isNaN(val)) {
                throw new HttpException(
                    "Validation failed", HttpStatus.BAD_REQUEST
                );
            }
            return val;
        }
    }
}
