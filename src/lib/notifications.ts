export type NotificationChannel = "email" | "sms";

export type NotificationEvent =
  | "reservation_confirmed"
  | "pickup_reminder"
  | "reservation_canceled"
  | "listing_sold_out"
  | "new_reservation"
  | "pickup_completed"
  | "donation_fallback_triggered"
  | "donation_available"
  | "donation_claimed"
  | "donation_pickup_reminder";

export type NotificationPreference = {
  userId?: string;
  email: boolean;
  sms: boolean;
  events: NotificationEvent[];
};

export const defaultNotificationPreferences: NotificationPreference = {
  email: true,
  sms: false,
  events: [
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
  ],
};

const eventMessageMap: Record<NotificationEvent, string> = {
  reservation_confirmed: "Your reservation is confirmed.",
  pickup_reminder: "Pickup reminder: your order window starts soon.",
  reservation_canceled: "Your reservation has been canceled.",
  listing_sold_out: "A listing you saved is now sold out.",
  new_reservation: "You have a new reservation.",
  pickup_completed: "Pickup has been marked complete.",
  donation_fallback_triggered: "Unsold listing moved to donation fallback.",
  donation_available: "A donation is available in your service area.",
  donation_claimed: "Donation claim confirmed.",
  donation_pickup_reminder: "Reminder: donation pickup is coming up.",
};

export type EmailNotificationResult = {
  provider: "mock-email";
  to: string;
  subject: string;
  body: string;
  deliveredAt: string;
};

export type SmsNotificationResult = {
  provider: "sms-placeholder";
  to: string;
  body: string;
  deliveredAt: string;
};

export type NotificationResult = EmailNotificationResult | SmsNotificationResult;

export async function sendEmail(to: string, subject: string, body: string) {
  return Promise.resolve<EmailNotificationResult>({
    provider: "mock-email",
    to,
    subject,
    body,
    deliveredAt: new Date().toISOString(),
  });
}

export async function sendSmsPlaceholder(to: string, body: string) {
  return Promise.resolve<SmsNotificationResult>({
    provider: "sms-placeholder",
    to,
    body,
    deliveredAt: new Date().toISOString(),
  });
}

export async function dispatchEventNotification(input: {
  event: NotificationEvent;
  toEmail?: string;
  toPhone?: string;
  preference?: NotificationPreference;
}): Promise<NotificationResult[]> {
  const preference = input.preference ?? defaultNotificationPreferences;
  if (!preference.events.includes(input.event)) return [];

  const message = eventMessageMap[input.event];
  const results: NotificationResult[] = [];

  if (preference.email && input.toEmail) {
    results.push(await sendEmail(input.toEmail, "NoWaste notification", message));
  }

  if (preference.sms && input.toPhone) {
    results.push(await sendSmsPlaceholder(input.toPhone, message));
  }

  return results;
}

