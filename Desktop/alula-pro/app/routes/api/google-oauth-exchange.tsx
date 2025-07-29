import { GOOGLE_OAUTH_CONFIG } from "~/lib/google-oauth";
import type { Route } from "./+types/google-oauth-exchange";

export async function action({ request }: Route.ActionArgs) {
  const { code } = await request.json();

  if (!code) {
    return Response.json({ error: "No authorization code provided" }, { status: 400 });
  }

  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientSecret) {
    return Response.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_OAUTH_CONFIG.clientId,
        client_secret: clientSecret,
        redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Token exchange failed:", error);
      return Response.json({ error: "Failed to exchange code for tokens" }, { status: 400 });
    }

    const tokens = await tokenResponse.json();

    // Get user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      return Response.json({ error: "Failed to get user info" }, { status: 400 });
    }

    const userInfo = await userInfoResponse.json();

    return Response.json({ tokens, userInfo });
  } catch (error) {
    console.error("OAuth exchange error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}