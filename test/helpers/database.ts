import { connectDatabase } from "../../src/modules/database/database.providers";
import { config } from "@utils/config";

import { Model as ValuesModel } from "@models/Value";
import { Model as GoodsModels } from "@models/Good";
import { Model as RegexpsModel } from "@models/Regexp";
import { Model as UsersModel } from "@models/User";
import { Model as CategroiesModel } from "@models/Categroy";

config.db.database = "storebox-test";

export const connect = connectDatabase;

export const drop = async () => {
    await ValuesModel.remove({ }).exec();
    await GoodsModels.remove({ }).exec();
    await RegexpsModel.remove({ }).exec();
    await UsersModel.remove({ }).exec();
    await CategroiesModel.remove({ }).exec();
};
