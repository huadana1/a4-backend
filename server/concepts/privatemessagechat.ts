import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface PrivateMessageChatDoc extends BaseDoc {
  user1: ObjectId;
  user2: ObjectId;
}

export interface PrivateMessageChatMessagesDoc extends BaseDoc {
  from: ObjectId;
  to: ObjectId;
  message: string;
}

export default class PrivateMessageChatConcept {
  public readonly chats: DocCollection<PrivateMessageChatDoc> = new DocCollection<PrivateMessageChatDoc>("chats");
  public readonly messages: DocCollection<PrivateMessageChatMessagesDoc> = new DocCollection<PrivateMessageChatMessagesDoc>("chatMesssages");

  /**
   *
   * @param user1 - id of the first user in chat
   * @param user2 - id of the second user in chat
   * @returns all messages associated with the chat between user1 and user2
   */
  async getAllMessages(user1: ObjectId, user2: ObjectId) {
    const messages = await this.messages.readMany({
      $or: [
        { from: user1, to: user2 },
        { from: user2, to: user1 },
      ],
    });
    return messages;
  }

  /**
   *
   * @param user - id of the user to get chats of
   * @returns all chats associated with the user
   */
  async getAllChats(user: ObjectId) {
    const chats = await this.chats.readMany({
      $or: [{ user1: user }, { user2: user }],
    });
    return chats;
  }

  /**
   *
   * @param user1 - user who is chatting with user2
   * @param user2 - user who is chatting with user1
   * @returns id of chat between user1 and user2 or throws error if chat not found
   */
  async getChatId(user1: ObjectId, user2: ObjectId) {
    const chat = await this.chats.readOne({
      $or: [
        { user1: user1, user2: user2 },
        { user1: user2, user2: user1 },
      ],
    });

    if (chat == null) {
      throw new ChatNotFoundError(user1, user2);
    }

    return chat._id;
  }

  /**
   *
   * @param user1 - first user in chat
   * @param user2 - second user in chat
   * @returns true if there is a chat between user1 and user2, false otherwise
   */
  private async isExistingChat(user1: ObjectId, user2: ObjectId) {
    const chat = await this.chats.readOne({
      $or: [
        { user1: user1, user2: user2 },
        { user1: user2, user2: user1 },
      ],
    });

    return chat != null;
  }

  /**
   *
   * @param user1 - id of the first user in the chat
   * @param user2 - id of the second user of the chat
   * @returns a new chat between user1 and user2 with the first message being message
   */
  async createChat(user1: ObjectId, user2: ObjectId) {
    if (await this.isExistingChat(user1, user2)) {
      throw new ChatAlreadyExistsError(user1, user2);
    }

    const _id = await this.chats.createOne({ user1, user2 });
    return { msg: "Chat successfully created!", chatId: _id };
  }

  /**
   *
   * @param chat - id of chat to delete
   */
  async deleteChat(chatId: ObjectId) {
    await this.chats.deleteOne({ _id: chatId });
    return { msg: "Chat deleted successfully!" };
  }

  /**
   *
   * @param from - user who is sending the message
   * @param to - user who is receiving the message
   * @param message - message to send to chat
   */
  async sendMessage(from: ObjectId, to: ObjectId, message: string) {
    if (message == null) {
      throw new EmptyMessageError();
    }

    // make sure a chat exists between the users before sending the message
    if (!(await this.isExistingChat(from, to))) {
      throw new ChatNotFoundError(from, to);
    }

    const _id = await this.messages.createOne({ from, to, message });
    return { msg: "Chat message sent!", sentMsg: await this.messages.readOne({ _id }) };
  }
}

export class EmptyMessageError extends BadValuesError {
  constructor() {
    super("Cannot send an empty message!");
  }
}
export class ChatNotFoundError extends NotFoundError {
  constructor(
    public readonly user1: ObjectId,
    public readonly user2: ObjectId,
  ) {
    super("Chat between {0} and {1} does not exist!", user1, user2);
  }
}
export class ChatAlreadyExistsError extends NotAllowedError {
  constructor(
    public readonly user1: ObjectId,
    public readonly user2: ObjectId,
  ) {
    super("Chat between {0} and {1} already exists!", user1, user2);
  }
}
