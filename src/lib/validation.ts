import { z } from "zod";

export const guestCheckoutSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.email("Valid email is required"),
  phone: z.string().min(7, "Valid phone number is required"),
});

export const listingSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description is required"),
  quantityTotal: z.number().int().positive(),
  priceCents: z.number().int().nonnegative(),
  pickupWindowStart: z.iso.datetime(),
  pickupWindowEnd: z.iso.datetime(),
  reservationCutoffAt: z.iso.datetime(),
  donationFallbackEnabled: z.boolean(),
  listingType: z.enum(["consumer", "donation"]),
});

export const restaurantOnboardingSchema = z.object({
  restaurantName: z.string().min(2, "Restaurant name is required"),
  ownerName: z.string().min(2, "Owner name is required"),
  email: z.email("Valid email is required"),
  phone: z.string().min(7, "Valid phone number is required"),
});

export type GuestCheckoutInput = z.infer<typeof guestCheckoutSchema>;
export type ListingInput = z.infer<typeof listingSchema>;
export type RestaurantOnboardingInput = z.infer<
  typeof restaurantOnboardingSchema
>;

