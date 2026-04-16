import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const foodServiceTypeSchema = z.enum([
  "restaurant",
  "cafe",
  "bakery",
  "catering",
  "grocery",
  "food_truck",
  "other",
]);

/** Restaurant sign-up: business details + attestation; enrollment code validated on the server when configured. */
export const restaurantStaffSignUpSchema = signUpSchema.extend({
  name: z.string().trim().min(2, "Name is required"),
  businessLegalName: z.string().trim().min(2, "Legal business name is required"),
  businessAddress: z.string().trim().min(8, "Business address is required"),
  businessEmail: z.email("Valid business email is required"),
  businessPhone: z.string().trim().min(10, "Enter a valid business phone number"),
  foodServiceType: foodServiceTypeSchema,
  foodServiceAttestation: z.boolean().refine((v) => v === true, {
    message: "Confirm that you represent a food service business",
  }),
  termsAccepted: z.boolean().refine((v) => v === true, {
    message: "You must accept the Terms of Service",
  }),
  businessRegistrationId: z.string().trim().optional(),
  enrollmentCode: z.string().trim().optional(),
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
    new Date(value.reservationCutoffAt) < new Date(value.pickupWindowStart),
  {
    path: ["reservationCutoffAt"],
    message: "Reservation cutoff must be before pickup starts",
  },
);


const dietaryPreferenceSchema = z.enum([
  "vegan",
  "vegetarian",
  "gluten_free",
  "dairy_free",
]);

export const donationReadyItemSchema = z.object({
  id: z.string().min(1),
  listingId: z.string().min(1),
  restaurantId: z.string().min(1),
  title: z.string().min(1),
  quantity: z.number().int().min(0),
  readyAt: z.string().min(1),
  status: z.enum(["donation_ready", "claimed", "picked_up", "completed"]),
  claimedByPartnerId: z.string().optional(),
});

export const donationQueuePayloadSchema = z.object({
  queue: z.array(donationReadyItemSchema),
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
  dietaryPreferences: z.array(dietaryPreferenceSchema),
  defaultMaxDistanceMiles: z.number().int().min(1).max(50),
  marketingOptIn: z.boolean(),
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
  endHour: z.number().int().min(0).max(23),
  smsEnabled: z.boolean(),
  emailEnabled: z.boolean(),
}).refine((value) => value.endHour > value.startHour, {
  path: ["endHour"],
  message: "End hour must be after start hour",
});

export const notificationPreferenceSchema = z.object({
  userId: z.string().min(1).optional(),
  email: z.boolean(),
  sms: z.boolean(),
  events: z.array(
    z.enum([
      "reservation_confirmed",
      "pickup_reminder",
      "reservation_canceled",
      "listing_sold_out",
      "new_reservation",
      "pickup_completed",
      "donation_fallback_triggered",
      "donation_available",
      "donation_claimed",
      "donation_pickup_reminder",
    ]),
  ),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type RestaurantStaffSignUpInput = z.infer<typeof restaurantStaffSignUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type GuestCheckoutInput = z.infer<typeof guestCheckoutSchema>;
export type ReservationCheckoutInput = z.infer<typeof reservationCheckoutSchema>;
export type ListingInput = z.infer<typeof listingSchema>;
export type RestaurantOnboardingInput = z.infer<
  typeof restaurantOnboardingSchema
>;
export type DonationQueuePayloadInput = z.infer<typeof donationQueuePayloadSchema>;
export type AccountSettingsInput = z.infer<typeof accountSettingsSchema>;
export type PickupVerificationInput = z.infer<typeof pickupVerificationSchema>;
export type DonationPartnerProfileInput = z.infer<typeof donationPartnerProfileSchema>;
export type NotificationPreferenceInput = z.infer<typeof notificationPreferenceSchema>;

