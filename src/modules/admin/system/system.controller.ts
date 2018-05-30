import { Roles } from "@decorators/roles";
import { DefResDto } from "@dtos/res";
import { RolesGuard } from "@guards/roles";
import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiUseTags } from "@nestjs/swagger";
import { SystemService } from "@services/system";
import { EditSystemVarDto } from "./system.dto";

@UseGuards(RolesGuard)
@Controller("api/v1/system")
// region Swagger Docs
@ApiUseTags("System")
@ApiBearerAuth()
// endregion Swagger Docs
export class SystemController {

    constructor(private readonly systemSvr: SystemService) { }

    @Roles("admin", "token")
    @Get("/vars")
    public getVars() {
        return this.systemSvr.get();
    }

    @Roles("admin")
    @Put("/vars")
    public async setVars(@Body() body: EditSystemVarDto) {
        await this.systemSvr.set(body.key, body.value);
        return new DefResDto();
    }

    @Roles("admin")
    @Get("/info")
    public info() {
        return this.systemSvr.info();
    }

}
