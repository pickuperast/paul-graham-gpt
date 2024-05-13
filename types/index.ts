export enum OpenAIModel {
  GPT_3_5_TURBO = "gpt-3.5-turbo"
}

export type ScriptFile = {
  filename: string;
  content: string;
  length: number;
  tokens: number;
  chunks: ScriptChunk[];
};

export type ScriptChunk = {
  cs_scriptfile: string;
  content: string;
  content_tokens: number;
  embedding: number[];
};

export type ProjectJSON = {
  current_date: string;
  author: string;
  tokens: number;
  scripts: ScriptFile[];
};
