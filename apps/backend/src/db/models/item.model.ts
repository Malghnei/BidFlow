import { Schema, model, type InferSchemaType } from "mongoose";

const itemSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    lotNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: false },
    startingBid: { type: Number, required: true },
    currentBid: { type: Number, required: true, default: 0 },
    currentBidder: { type: Schema.Types.ObjectId, required: false },
    currentBidType: {
      type: String,
      enum: ["individual", "group"],
      required: false,
    },
    bidCount: { type: Number, required: true, default: 0 },
    activeGroups: {
      type: [{ type: Schema.Types.ObjectId, ref: "Group" }],
      required: true,
      default: [],
    },
    status: {
      type: String,
      enum: ["upcoming", "live", "sold", "unsold"],
      required: true,
      default: "upcoming",
    },
    category: { type: String, required: false },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { versionKey: false, collection: "items" },
);

export type ItemDocument = InferSchemaType<typeof itemSchema>;

export const ItemModel = model("Item", itemSchema);
