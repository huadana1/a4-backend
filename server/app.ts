import CollaborativeModeConcept from "./concepts/collaborativemode";
import FriendConcept from "./concepts/friend";
import GalleryConcept from "./concepts/gallery";
import PostConcept from "./concepts/post";
import PrivateMessageChatConcept from "./concepts/privatemessagechat";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const Post = new PostConcept();
export const Friend = new FriendConcept();
export const Chat = new PrivateMessageChatConcept();
export const CollaborativeMode = new CollaborativeModeConcept();
export const Gallery = new GalleryConcept();
