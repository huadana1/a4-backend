import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

export interface PrivateMessageChatDoc extends BaseDoc {
  user1: ObjectId;
  user2: ObjectId;
  message: string; // set of strings?? how to get video/audio objectid?? TODO
}

export default class PrivateMessageChatConcept {
  public readonly chats: DocCollection<PrivateMessageChatDoc> = new DocCollection<PrivateMessageChatDoc>("chats");

  /**
   *
   * @param user - id of the user object
   * @returns all chats associated with user
   */
  async getChats(user: ObjectId) {}

  // TODO: change message to be video/audio instead of string
  /**
   *
   * @param user1 - id of the first user in the chat
   * @param user2 - id of the second user of the chat
   * @param message - initial message to send to the chat
   * @returns a new chat between user1 and user2 with the first message being message
   */
  async createChat(user1: ObjectId, user2: ObjectId, message: string) {}

  /**
   *
   * @param chat - id of chat to delete
   */
  async deleteChat(chat: ObjectId) {}

  /**
   *
   * @param chat - id of chat to send message to
   * @param message - message to send to chat
   */
  async sendMessage(chat: ObjectId, message: string) {}

  // do we need a date input here?
  /**
   *
   * @param chat - chat to view messages of
   * @returns set of messages from the chat
   */
  async viewOlderMessages(chat: ObjectId) {}
}
