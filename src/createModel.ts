import mongoose, { Document } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

export const createModel = <DocType>(
  modelName: string,
  schema: mongoose.Schema
) => {
  schema.plugin(uniqueValidator);

  const model = mongoose.model<DocType & Document>(modelName, schema);

  const create = (data: any) => model.create(data);

  const insertMany = (data: any) => model.insertMany(data);

  const readAll = () => model.find();

  const getTotalCount = () => model.estimatedDocumentCount();

  const read = ({
    sortBy,
    limit = 0,
    sortDir = "asc",
    offset = 0
  }: {
    sortBy?: string;
    sortDir?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    let result = readAll();

    if (limit) {
      result = result.limit(limit).skip(offset);
    }

    if (sortBy) {
      result = result.sort({ [sortBy]: sortDir });
    }

    return result;
  };

  const readAllBy = (data: any) => model.find(data);

  const readById = (id: number) => model.findById(id);

  const readOne = (data: any) => model.findOne(data);

  const update = (id: number, data: any) =>
    model.findByIdAndUpdate(id, data, { new: true });

  const deleteOne = (id: any) => model.findByIdAndDelete(id);

  const deleteAll = (callback: (err: any) => void) =>
    model.deleteMany({}, callback);

  return {
    readAll,
    readOne,
    readById,
    readAllBy,

    read,

    create,

    insertMany,
    update,

    deleteOne,
    deleteAll,

    getTotalCount
  };
};
