import { signal } from "../preact-signals.ts";

export const count = signal(0);

export function increment() {
	count.value += 1;
}

export function decrement() {
	count.value -= 1;
}
