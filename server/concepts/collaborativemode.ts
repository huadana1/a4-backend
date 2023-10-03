import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

export interface CollaborativeModeChatStatusDoc extends BaseDoc {
  chatId: ObjectId;
  status: "on" | "off";
  turn: ObjectId;
}

export interface CollaborativeModeContentDoc extends BaseDoc {
  chatId: ObjectId;
  message: string;
}

export default class CollaborativeModeConcept {
  public readonly collaborativeModeChatStatuses: DocCollection<CollaborativeModeChatStatusDoc> = new DocCollection<CollaborativeModeChatStatusDoc>("collaborativeModeChatStatuses");
  public readonly collaborativeModeContents: DocCollection<CollaborativeModeContentDoc> = new DocCollection<CollaborativeModeContentDoc>("collaborativeModeContents");

  async getCollabContent(chatId: ObjectId) {
    const content = await this.collaborativeModeContents.readMany(chatId, {
      sort: { dateUpdated: -1 },
    });
    return content;
  }

  async startCollab(chatId: ObjectId, userId: ObjectId) {
    const _id = await this.collaborativeModeChatStatuses.createOne({ chatId, status: "on", turn: userId });
    return { msg: "Collaborative Mode successfully turned on!", post: await this.collaborativeModeChatStatuses.readOne({ _id }) };
  }

  async finishCollab(chatId: ObjectId) {
    await this.collaborativeModeChatStatuses.deleteOne({ chatId });
    return { msg: "Chat deleted successfully!" };
  }

  async collab(chatId: ObjectId, message: string) {
    const _id = await this.collaborativeModeContents.createOne({ chatId, message });
    return { msg: "Succesfully collabrated!", post: await this.collaborativeModeContents.readOne({ _id }) };
  }
}