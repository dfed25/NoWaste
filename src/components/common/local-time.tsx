"use client";

type Props = {
  value: string;
  options?: Intl.DateTimeFormatOptions;
};

export function LocalTime({ value, options }: Props) {
  const date = new Date(value);
  return <>{date.toLocaleTimeString([], options)}</>;
}
