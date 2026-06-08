import { graphGet } from "./graphClient";
import type { Paging } from "./types";

export interface ProductCatalog {
  id: string;
  name: string;
  product_count?: number;
  vertical?: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  image_url?: string;
  url?: string;
  price?: string;
  currency?: string;
  availability?: string;
  brand?: string;
  category?: string;
  retailer_id?: string;
}

const CATALOG_FIELDS = ["id", "name", "product_count", "vertical"];
const PRODUCT_FIELDS = ["id", "name", "image_url", "url", "price", "currency", "availability", "brand", "category", "retailer_id"];

export async function listCatalogs(actId: string): Promise<{ data: ProductCatalog[]; paging?: Paging }> {
  return graphGet(`${actId}/product_catalogs`, { fields: CATALOG_FIELDS });
}

export async function getCatalogProducts(
  catalogId: string,
  params: { limit?: number; after?: string } = {}
): Promise<{ data: CatalogProduct[]; paging?: Paging }> {
  return graphGet(`${catalogId}/products`, { fields: PRODUCT_FIELDS, ...params });
}
