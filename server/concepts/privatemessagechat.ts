import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

export interface PrivateMessageChatDoc extends BaseDoc {
  user1: ObjectId;
  user2: ObjectId;
}

export interface PrivateMessageChatMessagesDoc extends BaseDoc {
  chatId: ObjectId;
  message: string;
}

export default class PrivateMessageChatConcept {
  public readonly chats: DocCollection<PrivateMessageChatDoc> = new DocCollection<PrivateMessageChatDoc>("chats");
  public readonly messages: DocCollection<PrivateMessageChatMessagesDoc> = new DocCollection<PrivateMessageChatMessagesDoc>("chatMesssages");

  /**
   *
   * @param chatId - id of the chat to get messages of
   * @returns all messages associated with the chat
   */
  async getMessages(chatId: ObjectId) {
    const messages = await this.messages.readMany(chatId, {
      sort: { dateUpdated: -1 },
    });
    return messages;
  }

  /**
   *
   * @param user - id of the user to get chats of
   * @returns all chats associated with the user
   */
  async getChats(user: ObjectId) {
    const messages = await this.chats.readMany(user, {
      sort: { dateUpdated: -1 },
    });
    return messages;
  }

  /**
   *
   * @param user1 - id of the first user in the chat
   * @param user2 - id of the second user of the chat
   * @param message - initial message to send to the chat
   * @returns a new chat between user1 and user2 with the first message being message
   */
  async createChat(user1: ObjectId, user2: ObjectId) {
    const _id = await this.chats.createOne({ user1, user2 });
    return { msg: "Chat successfully created!", post: await this.chats.readOne({ _id }) };
  }

  /**
   *
   * @param chat - id of chat to delete
   */
  async deleteChat(chatId: ObjectId) {
    await this.chats.deleteOne({ chatId });
    return { msg: "Chat deleted successfully!" };
  }

  /**
   *
   * @param chat - id of chat to send message to
   * @param message - message to send to chat
   */
  async sendMessage(chatId: ObjectId, message: string) {
    const _id = await this.messages.createOne({ chatId, message });
    return { msg: "Chat successfully created!", post: await this.chats.readOne({ _id }) };
  }
}
