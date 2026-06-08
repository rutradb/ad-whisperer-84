import { graphGet, graphPost, graphPostMultipart } from "./graphClient";
import type { Paging } from "./types";

export interface AdImage {
  id: string;
  hash: string;
  name: string;
  url: string;
  width: number;
  height: number;
  created_time: string;
  status: string;
}

export interface AdVideo {
  id: string;
  title: string;
  description?: string;
  source?: string;
  picture?: string;
  created_time: string;
  length?: number;
}

export interface AdImagesResponse {
  data: AdImage[];
  paging?: Paging;
}

export interface AdVideosResponse {
  data: AdVideo[];
  paging?: Paging;
}

export async function listImages(
  actId: string,
  params: { fields?: string[]; limit?: number; after?: string } = {}
): Promise<AdImagesResponse> {
  return graphGet<AdImagesResponse>(`${actId}/adimages`, {
    fields: params.fields || ["id", "hash", "name", "url", "width", "height", "created_time", "status"],
    limit: params.limit || 25,
    ...(params.after ? { after: params.after } : {}),
  });
}

export async function uploadImage(
  actId: string,
  imageUrl: string,
  name?: string
): Promise<any> {
  return graphPost(`${actId}/adimages`, {
    url: imageUrl,
    ...(name ? { name } : {}),
  });
}

export async function listVideos(
  actId: string,
  params: { fields?: string[]; limit?: number; after?: string } = {}
): Promise<AdVideosResponse> {
  return graphGet<AdVideosResponse>(`${actId}/advideos`, {
    fields: params.fields || ["id", "title", "description", "source", "picture", "created_time", "length"],
    limit: params.limit || 25,
    ...(params.after ? { after: params.after } : {}),
  });
}

export async function uploadVideo(
  actId: string,
  fileUrl: string,
  name?: string,
  title?: string
): Promise<{ id: string }> {
  return graphPost<{ id: string }>(`${actId}/advideos`, {
    file_url: fileUrl,
    ...(name ? { name } : {}),
    ...(title ? { title } : {}),
  });
}

export async function uploadImageFile(
  actId: string,
  file: File,
  name?: string
): Promise<any> {
  const fd = new FormData();
  fd.append("filename", file, file.name);
  if (name) fd.append("name", name);
  return graphPostMultipart(`${actId}/adimages`, fd);
}

export async function uploadVideoFile(
  actId: string,
  file: File,
  name?: string,
  title?: string
): Promise<{ id: string }> {
  const fd = new FormData();
  fd.append("source", file, file.name);
  if (name) fd.append("name", name);
  if (title) fd.append("title", title);
  return graphPostMultipart<{ id: string }>(`${actId}/advideos`, fd);
}
