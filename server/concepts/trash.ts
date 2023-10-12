import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface TrashDoc extends BaseDoc {
  item: string;
  user: ObjectId;
  expiration: string;
}

export default class TrashConcept {
  public readonly trash: DocCollection<TrashDoc> = new DocCollection<TrashDoc>("trash");

  async getSingleItem(user: ObjectId, id: ObjectId) {
    const item = await this.trash.readOne({ _id: id });

    if (item == null) {
      throw new NotFoundError("Could not find item {0} in trash", id);
    }
    if (item.user.toString() !== user.toString()) {
      throw new NotAllowedError("You do not have access to this item");
    }

    return item;
  }

  async getAllItems(user: ObjectId) {
    return this.trash.readMany({ user: user });
  }

  async deleteForver(user: ObjectId, id: ObjectId) {
    const item = await this.getSingleItem(user, id);
    return await this.trash.deleteOne(item);
  }

  async addItem(user: ObjectId, item: string) {
    const millisecondsInAWeek = 604800000;
    const expiration = new Date(Date.now() + millisecondsInAWeek).toISOString();

    return await this.trash.createOne({ user: user, item: item, expiration: expiration });
  }
}
