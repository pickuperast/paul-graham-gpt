import { supabaseAdmin } from "@/utils";

export const config = {
  runtime: "edge"
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { query, apiKey, matches } = (await req.json()) as {
      query: string;
      apiKey: string;
      matches: number;
    };

    const input = query.replace(/\n/g, " ");

    const res = await fetch("https://api.openai.com/v1/embeddings", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      method: "POST",
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input
      })
    });

    const json = await res.json();
    const embedding = json.data[0].embedding;

    if (!embedding) {
      console.error("No embedding found");
      return new Response("Error", { status: 500 });
    }

    if (!matches) {
      console.error("No matches found");
      return new Response("Error", { status: 500 });
    }

    const { data: chunks, error } = await supabaseAdmin
    .rpc("astana_games_codebase_search", {
      query_embedding: embedding,
      similarity_threshhold: 0.5,
      match_count: matches
    });

    if (error) {
      console.error(error);
      return new Response("Error", { status: 500 });
    }

    return new Response(JSON.stringify(chunks), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }
};

export default handler;
