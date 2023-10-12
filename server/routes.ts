import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Friend, Post, User, WebSession } from "./app";
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
  async sendFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.sendRequest(user, toId);
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

  // get the available chats, NOT getting the message
  @Router.get("/chats")
  async getAllChats(session: WebSessionDoc) {}

  // get the messages for a specific chat
  @Router.get("/chats/:chatId")
  async getChatMessages(chatId: ObjectId) {
    // return await Chat.getMessages(chatId);
  }

  @Router.post("/chats/:chatId")
  async sendChatMessage(chatId: ObjectId, message: string) {}

  @Router.delete("/chats/:chatId")
  async deleteChat(chatId: ObjectId) {}

  // turn on collaborative mode for a private chat
  @Router.post("/collaborativeMode/:chatId")
  async startCollaborativeMode(chatId: ObjectId, session: WebSessionDoc) {}

  // add a message to the cumulativeMessage content for the collabroative mode in the specific chat
  @Router.patch("/collaborativeMode/:chatId")
  async collaborate(chatId: ObjectId, message: String) {}

  // turn off collaborative mode inside the private chat and return the cumulative message stictched together
  @Router.delete("/collaborativeMode/:chatId")
  async finishCollaborativeMode(chatId: ObjectId) {}

  // get the cumulativeMessage content (not yet stitched together)
  @Router.get("/collaborativeMode/:chatId")
  async getCollabContent(chatId: ObjectId) {}

  @Router.get("/galleries")
  async getAllGalleryItems(session: WebSessionDoc) {}

  @Router.get("/galleries/:gallery/:itemId")
  async getOneGalleryItem(session: WebSessionDoc, itemId: ObjectId) {}

  // add item to specific gallery type i.e Trash, Video, Audio
  @Router.post("/galleries/:gallery/:itemType")
  async addItemToGallery(session: WebSessionDoc, item: String, itemType: String) {}

  @Router.delete("/galleries/:gallery/:itemId")
  async deleteItemFromGallery(itemId: ObjectId) {}

  @Router.get("/galleries/trash")
  async getAllTrashItems(session: WebSessionDoc) {}

  @Router.get("/galleries/trash/:itemId")
  async getOneTrashItem(session: WebSessionDoc, itemId: Object) {}

  @Router.delete("/galleries/trash/:itemId")
  async deleteForever(itemId: ObjectId) {}
}

export default getExpressRouter(new Routes());
