create table astana_games_codebase(
  id bigserial primary key,
  cs_scriptfile text,
  content text,
  content_tokens bigint,
  embedding vector(1536)
)



-- Calculate similarity between two vectors and embeding chunk
create or replace function astana_games_codebase_search(
  query_embedding vector(1536),
  similarity_threshhold float,
  match_count int
)
returns table (
  id bigint,
  cs_scriptfile text,
  content text,
  content_tokens bigint,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    astana_games_codebase.id,
    astana_games_codebase.cs_scriptfile,
    astana_games_codebase.content,
    astana_games_codebase.content_tokens,
    1 - (astana_games_codebase.embedding <=> query_embedding) as similarity
    from astana_games_codebase
    where 1 - (astana_games_codebase.embedding <=> query_embedding) > similarity_threshhold
    order by astana_games_codebase.embedding <=> query_embedding
    limit match_count;
end;
$$;

SET maintenance_work_mem TO '100 MB';

create index on astana_games_codebase
using ivfflat(embedding vector_cosine_ops)
with (lists = 100);

DELETE FROM astana_games_codebase WHERE id < 806;
DELETE FROM astana_games_codebase WHERE content = '';