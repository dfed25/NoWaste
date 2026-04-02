import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form";

describe("notification preferences component", () => {
  it("renders event-driven triggers heading", () => {
    const html = renderToStaticMarkup(<NotificationPreferencesForm />);
    expect(html).toContain("Event-driven triggers");
  });
});

