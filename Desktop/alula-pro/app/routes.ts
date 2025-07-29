import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("sign-in/*", "routes/sign-in.tsx"),
  route("sign-up/*", "routes/sign-up.tsx"),
  route("onboarding", "routes/onboarding.tsx"),
  route("pricing", "routes/pricing.tsx"),
  route("success", "routes/success.tsx"),
  route("subscription-required", "routes/subscription-required.tsx"),
  route("auth/google/callback", "routes/auth.google.callback.tsx"),
  route("api/google-oauth-exchange", "routes/api/google-oauth-exchange.tsx"),
  layout("routes/dashboard/layout.tsx", [
    route("dashboard", "routes/dashboard/index.tsx"),
    route("dashboard/clients", "routes/dashboard/clients.tsx"),
    route("dashboard/clients/:clientId", "routes/dashboard/clients.$clientId.tsx"),
    route("dashboard/archive", "routes/dashboard/archive.tsx"),
    route("dashboard/chat", "routes/dashboard/chat.tsx"),
    route("dashboard/settings", "routes/dashboard/settings.tsx"),
  ]),
] satisfies RouteConfig;
