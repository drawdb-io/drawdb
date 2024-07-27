import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...args) {
  return twMerge(clsx(args));
}
