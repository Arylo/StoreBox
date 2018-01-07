import {
    BadRequestException, PipeTransform, Pipe, ArgumentMetadata
} from "@nestjs/common";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";

@Pipe()
export class ValidationPipe implements PipeTransform<any> {
    public async transform(value, metadata: ArgumentMetadata) {
        const { metatype } = metadata;
        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }
        const object = plainToClass(metatype, value);
        const errors = await validate(object);
        if (errors.length > 0) {
            if (Object.keys(value).length === 1) {
                throw new BadRequestException("Param Validation failed");
            } else {
                throw new BadRequestException("Params Validation failed");
            }
        }
        return value;
    }

    private toValidate(metatype): boolean {
        const types = [ String, Boolean, Number, Array, Object ];
        return !types.find((type) => metatype === type);
    }
}
