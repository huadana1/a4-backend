import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotFoundError } from "./errors";

export interface GalleryDoc extends BaseDoc {
  galleryName: string;
  user: ObjectId;
}

export interface GalleryItemsDoc extends BaseDoc {
  item: string;
  gallery: ObjectId;
  user: ObjectId;
}

export default class GalleryConcept {
  public readonly galleries: DocCollection<GalleryDoc> = new DocCollection<GalleryDoc>("galleries");
  public readonly galleryItems: DocCollection<GalleryItemsDoc> = new DocCollection<GalleryItemsDoc>("galleryItems");

  /**
   *
   * @param user - user to get galleries of
   * @returns all galleries for the given user
   */
  async getAllUserGalleries(user: ObjectId) {
    const galleries = await this.galleries.readMany({ user: user });
    return galleries;
  }

  private async getGalleryByName(user: ObjectId, galleryName: string) {
    const gallery = await this.galleries.readOne({ galleryName: galleryName, user: user });

    return gallery;
  }

  async getGalleryItemsByGalleryName(user: ObjectId, galleryName: string) {
    const gallery = await this.getGalleryByName(user, galleryName);

    if (gallery == null) {
      throw new NotFoundError("Gallery {0} could not be found", galleryName);
    }

    const items = await this.galleryItems.readMany({ gallery: gallery._id });

    return items;
  }

  async getSingleItem(user: ObjectId, itemId: string) {
    const i = await this.galleryItems.readOne({ user: user, _id: new ObjectId(itemId) });

    if (i == null) {
      throw new NotFoundError("Could not find item {0}", itemId);
    }

    return i.item;
  }

  async addItem(user: ObjectId, itemType: string, item: string) {
    const gallery = await this.getGalleryByName(user, itemType);

    let galleryId;

    if (gallery == null) {
      galleryId = await this.galleries.createOne({ galleryName: itemType, user: user });
    } else {
      galleryId = gallery._id;
    }

    return { msg: "Item added to gallery!", item: await this.galleryItems.createOne({ gallery: galleryId, user: user, item: item }) };
  }

  async deleteItem(user: ObjectId, id: string) {
    const i = await this.galleryItems.readOne({ user: user, _id: new ObjectId(id) });

    if (i == null) {
      throw new NotFoundError("Could not find item {0}", id);
    }

    return await this.galleryItems.deleteOne(i);
  }
}
