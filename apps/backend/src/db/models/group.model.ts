import { Schema, model, type InferSchemaType } from "mongoose";

const groupMemberSchema = new Schema(
  {
    bidderId: { type: Schema.Types.ObjectId, ref: "Bidder", required: true },
    displayName: { type: String, required: true },
    contribution: { type: Number, required: true },
    holdId: { type: String, required: false },
    holdStatus: {
      type: String,
      enum: ["pending", "held", "charged", "released"],
      required: true,
      default: "pending",
    },
    joinedAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false, versionKey: false },
);

const groupSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    groupName: { type: String, required: true },
    joinCode: { type: String, required: true },
    qrCodeUrl: { type: String, required: true },
    leaderId: { type: Schema.Types.ObjectId, ref: "Bidder", required: true },
    totalAmount: { type: Number, required: true, default: 0 },
    members: { type: [groupMemberSchema], required: true, default: [] },
    mergedFrom: {
      type: [{ type: Schema.Types.ObjectId, ref: "Group" }],
      required: true,
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "won", "lost", "merged"],
      required: true,
      default: "active",
    },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { versionKey: false, collection: "groups" },
);

groupSchema.index({ eventId: 1, joinCode: 1 }, { unique: true });
groupSchema.index({ eventId: 1, itemId: 1, status: 1 });
groupSchema.index({ "members.bidderId": 1 });

export type GroupDocument = InferSchemaType<typeof groupSchema>;

export const GroupModel = model("Group", groupSchema);
