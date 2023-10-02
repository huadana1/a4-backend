import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

export interface CollaborativeModeChatStatusDoc extends BaseDoc {
  chat: ObjectId;
  status: "on" | "off";
  turn: ObjectId;
}

export interface CollaborativeModeContentDoc extends BaseDoc {
  chat: ObjectId;
  message: string;
}

export default class CollaborativeModeConcept {
  public readonly collaborativeModeChatStatuses: DocCollection<CollaborativeModeChatStatusDoc> = new DocCollection<CollaborativeModeChatStatusDoc>("collaborativeModeChatStatuses");

  public readonly collaborativeModeContents: DocCollection<CollaborativeModeContentDoc> = new DocCollection<CollaborativeModeContentDoc>("collaborativeModeContents");

  async getCollabContent(chat: ObjectId) {}

  async startCollab(chat: ObjectId, message: string) {}

  async finishCollab(chat: ObjectId) {}

  async collab(chat: ObjectId, message: string) {}
}
