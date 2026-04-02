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

export const reservationCheckoutSchema = guestCheckoutSchema.extend({
  quantity: z.number().int().positive(),
});

export const listingSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description is required"),
  allergyNotes: z.string().max(500, "Keep notes under 500 characters").optional(),
  quantityTotal: z.number().int().positive(),
  discountedPriceCents: z.number().int().nonnegative(),
  pickupWindowStart: z.string().min(1, "Pickup start is required"),
  pickupWindowEnd: z.string().min(1, "Pickup end is required"),
  reservationCutoffAt: z.string().min(1, "Reservation cutoff is required"),
  donationFallbackEnabled: z.boolean(),
  photoFileName: z.string().optional(),
  listingType: z.enum(["consumer", "donation"]),
}).refine(
  (value) => new Date(value.pickupWindowEnd) > new Date(value.pickupWindowStart),
  {
    path: ["pickupWindowEnd"],
    message: "Pickup window end must be after start",
  },
).refine(
  (value) =>
    new Date(value.reservationCutoffAt) <= new Date(value.pickupWindowStart),
  {
    path: ["reservationCutoffAt"],
    message: "Reservation cutoff must be before pickup starts",
  },
);

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

export const pickupVerificationSchema = z.object({
  reservationCode: z.string().min(6, "Reservation code is required"),
  outcome: z.enum(["picked_up", "missed_pickup"]),
  note: z.string().max(300).optional(),
});

export const donationPartnerProfileSchema = z.object({
  organizationName: z.string().min(2, "Organization name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.email("Valid contact email is required"),
  serviceRadiusMiles: z.number().positive("Service radius must be positive"),
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(1).max(24),
  smsEnabled: z.boolean(),
  emailEnabled: z.boolean(),
});

export const notificationPreferenceSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  reservationConfirmed: z.boolean(),
  pickupReminder: z.boolean(),
  reservationCanceled: z.boolean(),
  listingSoldOut: z.boolean(),
  newReservation: z.boolean(),
  pickupCompleted: z.boolean(),
  donationFallbackTriggered: z.boolean(),
  donationAvailable: z.boolean(),
  donationClaimed: z.boolean(),
  donationPickupReminder: z.boolean(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type GuestCheckoutInput = z.infer<typeof guestCheckoutSchema>;
export type ReservationCheckoutInput = z.infer<typeof reservationCheckoutSchema>;
export type ListingInput = z.infer<typeof listingSchema>;
export type RestaurantOnboardingInput = z.infer<
  typeof restaurantOnboardingSchema
>;
export type AccountSettingsInput = z.infer<typeof accountSettingsSchema>;
export type PickupVerificationInput = z.infer<typeof pickupVerificationSchema>;
export type DonationPartnerProfileInput = z.infer<typeof donationPartnerProfileSchema>;
export type NotificationPreferenceInput = z.infer<typeof notificationPreferenceSchema>;

