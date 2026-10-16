export interface TopicOffline {
  id: string; // UUID
  name: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export type Topic = TopicOffline;

export interface TopicDto {
  id: string;
  name: string;
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface CreateTopicRequest {
  name: string;
}

export interface UpdateTopicRequest {
  name: string;
}
