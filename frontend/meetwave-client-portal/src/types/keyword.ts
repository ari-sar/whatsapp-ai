export interface Keyword {
  id: string;
  trigger: string;
  responseMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface KeywordInput {
  trigger: string;
  responseMessage: string;
}
