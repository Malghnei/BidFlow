import { Schema, model, type InferSchemaType } from "mongoose";

const bidSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    bidderId: { type: Schema.Types.ObjectId, ref: "Bidder", required: false },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: false },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["individual", "group"], required: true },
    displayName: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    source: { type: String, enum: ["ios", "web", "manual"], required: true },
    status: {
      type: String,
      enum: ["active", "outbid", "winning"],
      required: true,
      default: "active",
    },
  },
  { versionKey: false, collection: "bids" },
);

bidSchema.index({ eventId: 1, itemId: 1, amount: -1 });

export type BidDocument = InferSchemaType<typeof bidSchema>;

export const BidModel = model("Bid", bidSchema);
