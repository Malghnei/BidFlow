import { Schema, model, type InferSchemaType } from "mongoose";

const bidderSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    bidderCode: { type: String, required: true },
    bidderNumber: { type: Number, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    displayName: { type: String, required: true },
    anonymityMode: {
      type: String,
      enum: ["real_name", "nickname", "anonymous"],
      required: true,
    },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    tableNumber: { type: Number, required: false },
    stripeCustomerId: { type: String, required: false },
    paymentMethodId: { type: String, required: false },
    paymentLinked: { type: Boolean, required: true, default: false },
    checkedIn: { type: Boolean, required: true, default: false },
    checkedInAt: { type: Date, required: false },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { versionKey: false, collection: "bidders" },
);

bidderSchema.index({ eventId: 1, bidderCode: 1 }, { unique: true });

export type BidderDocument = InferSchemaType<typeof bidderSchema>;

export const BidderModel = model("Bidder", bidderSchema);
