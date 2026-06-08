function env(key: string, required = true): string {
  const val = process.env[key];
  if (!val && required) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return val || "";
}

export const config = {
  port: Number(process.env.PORT || "8080"),
  clientId: env("GOOGLE_ADS_CLIENT_ID"),
  clientSecret: env("GOOGLE_ADS_CLIENT_SECRET"),
  developerToken: env("GOOGLE_ADS_DEVELOPER_TOKEN"),
  allowedOrigin: env("ALLOWED_ORIGIN"),
  loginCustomerId: env("LOGIN_CUSTOMER_ID", false),
  googleAdsApiVersion: "v23",
  get googleAdsBaseUrl() {
    return `https://googleads.googleapis.com/${this.googleAdsApiVersion}`;
  },
};
