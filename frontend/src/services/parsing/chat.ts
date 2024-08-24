export interface ChatLogItem {
    type: string;
    message: string | SearchResult;
}

export interface SearchResult {
    question: string;
    llm_response: string;
    embeddings_info: EmbeddingInfo[];
  }

export interface GetAllPrompts {
    id: number | string;
    guid: string;
    PromptText: string;
    IsActive: null | boolean;
    Area: string;
    CreatedAt: Date;
    LastModified: Date;
  }

  export interface EmbeddingInfo {
    name: string;
    text: string;
    chunk_number: number;
    file_id: number;
    page_number: number;
    distance: number;
  }

  export interface ChatLog {
    type: string;
    message: string;
    userId?: number;
    first_name?: string;
    timestamp: string;
}