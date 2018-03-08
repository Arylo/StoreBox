import { Model as GoodsModels } from "@models/Good";

export const getIdByOriginname = async (name: string) => {
    return (await GoodsModels.findOne({ originname: name }).exec())._id;
};
