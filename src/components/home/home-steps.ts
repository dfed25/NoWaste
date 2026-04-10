export type HomeStep = {
  step: string;
  title: string;
  desc: string;
};

/** Single source of truth for the 1–2–3 flow on marketing and authenticated home. */
export const SHARED_HOME_STEPS: readonly HomeStep[] = [
  { step: "1", title: "Browse", desc: "See nearby surplus with clear pickup times." },
  { step: "2", title: "Reserve", desc: "Check out in seconds with a confirmation code." },
  { step: "3", title: "Pick up", desc: "Show your code during the pickup window." },
];
