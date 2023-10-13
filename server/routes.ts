import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Chat, CollaborativeMode, Friend, Gallery, Post, Trash, User, WebSession } from "./app";
import { BadValuesError } from "./concepts/errors";
import { PostDoc, PostOptions } from "./concepts/post";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import Responses from "./responses";

class Routes {
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    return await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return Post.delete(_id);
  }

  @Router.get("/friends")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToUsernames(await Friend.getFriends(user));
  }

  // TODO: sync deleting friend with deleting private chat
  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await Friend.removeFriend(user, friendId);
  }

  @Router.get("/friend/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Friend.getRequests(user));
  }

  // sync adding friend and making new private message chat
  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: string, message: string, messageType: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;

    await Chat.createChat(user, toId);
    const sentMessage = await Chat.sendMessage(user, toId, message);
    await Gallery.addItem(user, messageType, message);

    return { msg: sentMessage.msg + (await Friend.sendRequest(user, toId)).msg };
  }

  // sync deleting friend with deleting chat
  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.removeRequest(user, toId);
  }

  // TODO: sync adding friend with making new private message chat
  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.acceptRequest(fromId, user);
  }

  // TODO: sync deleting friend with deleting chat
  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.rejectRequest(fromId, user);
  }

  // get chat messages between logged in user and user2
  @Router.get("/chats/chat/:username?")
  async getChatMessages(session: WebSessionDoc, username: string) {
    if (username == null) {
      throw new BadValuesError("Username cannot be empty!");
    }

    const user = WebSession.getUser(session);
    const u2Id = (await User.getUserByUsername(username))._id;
    return await Chat.getAllMessages(user, u2Id);
  }

  // get the available chats, NOT getting the message
  @Router.get("/chats")
  async getAllChats(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Chat.getAllChats(user);
  }

  @Router.post("/chats/chat/:to")
  async sendChatMessage(session: WebSessionDoc, to: string, message: string, messageType: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    const sentMessage = await Chat.sendMessage(user, toId, message);
    await Gallery.addItem(user, messageType, message);

    return sentMessage.msg;
  }

  @Router.delete("/chats/:chatId")
  async deleteChat(chatId: ObjectId) {
    return await Chat.deleteChat(chatId);
  }

  // turn on collaborative mode for a private chat
  @Router.post("/collaborativeModes")
  async startCollaborativeMode(session: WebSessionDoc, username: string, message: string) {
    const user = WebSession.getUser(session);
    const user2 = (await User.getUserByUsername(username))._id;
    await CollaborativeMode.startCollab(user, user2);
    return await CollaborativeMode.collab(user, user2, message);
  }

  // add a message to the cumulativeMessage content for the collabroative mode in the specific chat
  @Router.patch("/collaborativeModes")
  async collaborate(session: WebSessionDoc, username: string, message: string) {
    const user = WebSession.getUser(session);
    const user2 = (await User.getUserByUsername(username))._id;
    return await CollaborativeMode.collab(user, user2, message);
  }

  // turn off collaborative mode inside the private chat and return the cumulative message stictched together
  @Router.delete("/collaborativeModes")
  async finishCollaborativeMode(session: WebSessionDoc, username: string) {
    const user = WebSession.getUser(session);
    const user2 = (await User.getUserByUsername(username))._id;
    return await CollaborativeMode.finishCollab(user, user2);
  }

  // get the cumulativeMessage content
  @Router.get("/collaborativeMode/content")
  async getCollabContent(session: WebSessionDoc, username: string) {
    const user = WebSession.getUser(session);
    const user2 = (await User.getUserByUsername(username))._id;
    return await CollaborativeMode.getCollabContent(user, user2);
  }

  @Router.get("/collaborativeMode")
  async getCollabMode(session: WebSessionDoc, username: string) {
    const user = WebSession.getUser(session);
    const user2 = (await User.getUserByUsername(username))._id;
    return await CollaborativeMode.getCollabMode(user, user2);
  }

  @Router.get("/galleries/gallery/items/:itemId?")
  async getOneGalleryItem(session: WebSessionDoc, item: string) {
    if (item == null) {
      throw new BadValuesError("ItemId cannot be empty!");
    }

    const user = WebSession.getUser(session);
    return await Gallery.getSingleItem(user, item);
  }

  @Router.get("/galleries/gallery/:galleryName?")
  async getAllGalleryItems(session: WebSessionDoc, galleryName: string) {
    if (galleryName == null) {
      throw new BadValuesError("GalleryName cannot be empty!");
    }

    const user = WebSession.getUser(session);
    return await Gallery.getGalleryItemsByGalleryName(user, galleryName);
  }

  @Router.get("/galleries")
  async getAllUserGalleries(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Gallery.getAllUserGalleries(user);
  }

  @Router.get("/trash/item/:itemId?")
  async getOneTrashItem(session: WebSessionDoc, itemId: ObjectId) {
    if (itemId == null) {
      throw new BadValuesError("ItemId cannot be empty!");
    }

    const user = WebSession.getUser(session);
    return await Trash.getSingleItem(user, itemId);
  }

  @Router.get("/trash")
  async getAllTrashItems(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Trash.getAllItems(user);
  }

  @Router.delete("/trash/item/:itemId?")
  async deleteForever(session: WebSessionDoc, itemId: ObjectId) {
    if (itemId == null) {
      throw new BadValuesError("ItemId cannot be empty!");
    }

    const user = WebSession.getUser(session);
    return await Trash.deleteForver(user, itemId);
  }

  @Router.post("/trash")
  async addItem(session: WebSessionDoc, item: string) {
    if (item == null) {
      throw new BadValuesError("Item cannot be empty!");
    }

    const user = WebSession.getUser(session);
    return await Trash.addItem(user, item);
  }
}

export default getExpressRouter(new Routes());
