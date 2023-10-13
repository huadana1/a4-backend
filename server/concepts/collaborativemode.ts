import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotFoundError } from "./errors";

export interface CollaborativeModeDoc extends BaseDoc {
  user1: ObjectId;
  user2: ObjectId;
  turn: ObjectId;
}

export interface CollaborativeModeContentDoc extends BaseDoc {
  collabModeId: ObjectId;
  cumulativeMessage: Array<string>;
}

export default class CollaborativeModeConcept {
  public readonly collaborativeModes: DocCollection<CollaborativeModeDoc> = new DocCollection<CollaborativeModeDoc>("collaborativeModes");
  public readonly collaborativeModeContents: DocCollection<CollaborativeModeContentDoc> = new DocCollection<CollaborativeModeContentDoc>("collaborativeModeContents");

  async getCollabMode(user1: ObjectId, user2: ObjectId) {
    const collabMode = await this.collaborativeModes.readOne({
      $or: [
        { user1: user1, user2: user2 },
        { user1: user2, user2: user1 },
      ],
    });

    if (collabMode == null) {
      throw new NotFoundError("Collaboration Mode between {0} and {1} was not found", user1, user2);
    }

    return collabMode;
  }

  async getCollabContent(user1: ObjectId, user2: ObjectId) {
    const collabMode = await this.getCollabMode(user1, user2);

    const content = await this.collaborativeModeContents.readOne({ collabModeId: collabMode._id });

    return content;
  }

  async startCollab(user1: ObjectId, user2: ObjectId) {
    return await this.collaborativeModes.createOne({ user1: user1, user2: user2, turn: user1 });
  }

  async finishCollab(user1: ObjectId, user2: ObjectId) {
    const collabMode = await this.getCollabMode(user1, user2);

    await this.collaborativeModes.deleteOne(collabMode);

    return { msg: "Collaboration finished successfully!", result: (await this.collaborativeModeContents.readOne({ collabModeId: collabMode._id }))?.cumulativeMessage };
  }

  async collab(user1: ObjectId, user2: ObjectId, message: string) {
    const collabMode = await this.getCollabMode(user1, user2);
    let priorContent = await this.getCollabContent(user1, user2);

    if (priorContent == null) {
      this.collaborativeModeContents.createOne({ collabModeId: collabMode._id, cumulativeMessage: [] });
      priorContent = await this.getCollabContent(user1, user2);
    }

    const update = priorContent?.cumulativeMessage || [];
    update.push(message);

    const _id = await this.collaborativeModeContents.updateOne({ collabModeId: collabMode._id }, { cumulativeMessage: update });
    await this.collaborativeModes.updateOne(collabMode, { turn: user2 });

    return { msg: "Succesfully collabrated!" };
  }
}
