// Stub for the "server-only" package in test environments.
// The real package throws at import time if included in a client bundle;
// this stub is a no-op so server modules can be imported in Vitest.
export {};
