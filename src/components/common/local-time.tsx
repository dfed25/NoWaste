"use client";

type Props = {
  value: string;
  options?: Intl.DateTimeFormatOptions;
};

export function LocalTime({ value, options }: Props) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return <>-</>;
  }

  return <>{date.toLocaleTimeString([], options)}</>;
}
