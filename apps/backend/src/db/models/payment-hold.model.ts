import { Schema, model, type InferSchemaType } from "mongoose";

const paymentHoldSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    bidderId: { type: Schema.Types.ObjectId, ref: "Bidder", required: true },
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: false },
    stripePaymentIntentId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "authorized", "captured", "canceled"],
      required: true,
      default: "pending",
    },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { versionKey: false, collection: "paymentHolds" },
);

paymentHoldSchema.index({ bidderId: 1, status: 1 });

export type PaymentHoldDocument = InferSchemaType<typeof paymentHoldSchema>;

export const PaymentHoldModel = model("PaymentHold", paymentHoldSchema);
