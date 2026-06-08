import { graphGet, graphPost } from "./graphClient";
import type { Paging } from "./types";

export interface Comment {
  id: string;
  message: string;
  from?: { name: string; id: string };
  created_time: string;
  like_count?: number;
  comment_count?: number;
  is_hidden?: boolean;
}

export interface CommentsResponse {
  data: Comment[];
  paging?: Paging;
}

export async function getPostComments(
  postId: string,
  params: { limit?: number; after?: string } = {}
): Promise<CommentsResponse> {
  return graphGet<CommentsResponse>(`${postId}/comments`, {
    fields: ["id", "message", "from", "created_time", "like_count", "comment_count", "is_hidden"],
    limit: params.limit || 25,
    ...(params.after ? { after: params.after } : {}),
  });
}

export async function replyToComment(
  commentId: string,
  message: string
): Promise<{ id: string }> {
  return graphPost<{ id: string }>(`${commentId}/comments`, { message });
}

export async function hideComment(
  commentId: string,
  isHidden: boolean
): Promise<{ success: boolean }> {
  return graphPost<{ success: boolean }>(commentId, { is_hidden: isHidden });
}
