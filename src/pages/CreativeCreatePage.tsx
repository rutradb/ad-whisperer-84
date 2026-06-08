import { Navigate } from "react-router-dom";

/**
 * Creatives are now Assets in Google Ads.
 * Redirect to /assets page.
 */
export default function CreativeCreatePage() {
  return <Navigate to="/assets" replace />;
}
