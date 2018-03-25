import { Model as GoodsModels } from "@models/Good";
import { config } from "@utils/config";

export const getIdByOriginname = async (name: string) => {
    return (await GoodsModels.findOne({ originname: name }).exec())._id;
};
