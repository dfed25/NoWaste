import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form";
import { ToastProvider } from "@/components/feedback/toast-provider";

describe("notification preferences component", () => {
  it("renders loading state before preferences fetch resolves", () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <NotificationPreferencesForm />
      </ToastProvider>,
    );
    expect(html).toContain("Loading notification settings");
  });
});
