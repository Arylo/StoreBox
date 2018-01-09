import { model, SchemaDefinition, Model as M, SchemaTypes } from "mongoose";
import { Base, IDoc, IDocRaw, ObjectId } from "@models/common";
import { IValues, Flag as ValueFlag } from "@models/Value";
import { MongoError } from "mongodb";

export const Flag = "categroies";

const Definition: SchemaDefinition = {
    name: { type: String, required: true, unique: true },
    tags: [ String ],
    attributes: [{
        type: SchemaTypes.ObjectId,
        ref: ValueFlag
    }],
    pid: {
        type: SchemaTypes.ObjectId,
        ref: Flag
    }
};

export interface ICategroy extends IDocRaw {
    name: string;
    tags: string[];
    attributes: [ ObjectId ] | [ IValues ];
    pid: ObjectId | ICategroy;
}

export interface ICategroyRaw extends ICategroy {
    attributes: [ IValues ];
    pid: ICategroy;
}

const CategroySchema = new Base(Definition).createSchema();

const getIdGroups = (obj): string[] => {
    const selfIdArr = [ obj._id.toString() ];
    if (obj.pid) {
        if (obj.pid._id) {
            return selfIdArr.concat(getIdGroups(obj.pid));
        } else {
            return selfIdArr.concat(obj.pid.toString());
        }
    } else {
        return selfIdArr;
    }
};

CategroySchema.static("moveCategroy", async (id: ObjectId, pid: ObjectId) => {
    const curCate = await Model.findById(id)
        .exec();
    const parentCate = await Model.findById(pid)
        .select("_id pid")
        .populate({
            path: "pid", populate: { path: "pid", select: "pid" }, select: "pid"

        })
        .exec();
    if (!curCate || !parentCate) {
        return Promise.reject(
            new MongoError("The ID Category isnt exist")
        );
    }

    const idSet = new Set(getIdGroups(parentCate.toObject()));
    if (idSet.size !== 1 && idSet.has(curCate._id.toString())) {
        return Promise.reject(
            new MongoError("It would bad loop, if set the Parent Categroy")
        );
    }
    return Model.findByIdAndUpdate(id, {
        pid: pid
    }).exec();
});

export type CategroyDoc = IDoc<ICategroy>;

export interface ICategroyModel<T extends CategroyDoc> extends M<T> {
    moveCategroy(id: ObjectId, pid: ObjectId): Promise<T>;
}

export const Model = model(Flag, CategroySchema) as ICategroyModel<CategroyDoc>;
