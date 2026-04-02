import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const passwordResetSchema = z.object({
  email: z.email("Valid email is required"),
});

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
  addressLine1: z.string().min(3, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().min(2, "Timezone is required"),
  hoursOfOperation: z.string().min(5, "Hours are required"),
  contactPersonName: z.string().min(2, "Contact person is required"),
  contactPersonEmail: z.email("Valid contact email is required"),
  contactPersonPhone: z.string().min(7, "Valid contact phone is required"),
  donationFallbackEnabled: z.boolean(),
  preferredDonationPartner: z.string().optional(),
  paymentOnboardingStatus: z.enum([
    "not_started",
    "in_progress",
    "completed",
  ]),
});

export const accountSettingsSchema = z.object({
  displayName: z.string().min(2, "Display name is required"),
  email: z.email("Valid email is required"),
  phone: z.string().min(7, "Valid phone number is required"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type GuestCheckoutInput = z.infer<typeof guestCheckoutSchema>;
export type ListingInput = z.infer<typeof listingSchema>;
export type RestaurantOnboardingInput = z.infer<
  typeof restaurantOnboardingSchema
>;
export type AccountSettingsInput = z.infer<typeof accountSettingsSchema>;

