import { Navigate } from "react-router-dom";

/**
 * Creatives are now Assets in Google Ads.
 * Redirect to /assets page.
 */
export default function CreativeEditPage() {
  return <Navigate to="/assets" replace />;
}
