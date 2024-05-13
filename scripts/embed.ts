import { ScriptFile, ProjectJSON } from "@/types";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { Configuration, OpenAIApi } from "openai";

loadEnvConfig("");

const generateEmbeddings = async (scripts: ScriptFile[]) => {
  const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
  const openai = new OpenAIApi(configuration);
  
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  for (let i = 0; i < scripts.length; i++) {
    const section = scripts[i];
    console.log("section", i, scripts[i]);
    for (let j = 0; j < section.chunks.length; j++) {
      const chunk = section.chunks[j];
      console.log("chunk", chunk);
      const { cs_scriptfile, content, content_tokens } = chunk;

      console.log("content", content);

      const embeddingResponse = await openai.createEmbedding({
        model: "text-embedding-3-small",
        input: content
      });

      //console.log("embeddingResponse", embeddingResponse);

      const [{ embedding }] = embeddingResponse.data.data;

      if (chunk.content === ""){
        console.log("empty chunk", i, j);
        continue;
      }

      const { data, error } = await supabase
        .from("astana_games_codebase")
        .insert({
          cs_scriptfile: chunk.cs_scriptfile,
          content: chunk.content,
          content_tokens: chunk.content_tokens,
          embedding
        })
        .select("*");

      if (error) {
        console.log("error", error);
      } else {
        console.log("saved", i, j);
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
};

(async () => {
  const book: ProjectJSON = JSON.parse(fs.readFileSync("scripts/astana_games_codebase/project_data.json", "utf8"));

  await generateEmbeddings(book.scripts);
})();
