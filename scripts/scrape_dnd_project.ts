import * as fs from "fs";
import { ScriptChunk, ScriptFile, ProjectJSON } from "@/types";
import { encode } from "gpt-3-encoder";

const projectFolderPath = "C:\\Users\\User\\wkspaces\\Unity_3D_Zombie_Royale\\Assets\\-ZombieRoyale\\Scripts";
const dungeonArchitectFolderPath = "C:\\Users\\User\\wkspaces\\Unity_3D_Zombie_Royale\\Assets\\CodeRespawn";
const ASTANA_GAMES_CODEBASE = "astana_games_codebase";
const CHUNK_SIZE = 200;

const findCSFiles = async (folderPath: string): Promise<ScriptFile[]> => {
  const files = await fs.promises.readdir(folderPath);
  const scriptFiles: ScriptFile[] = [];

  for (const file of files) {
    const filePath = `${folderPath}\\${file}`;
    const stat = await fs.promises.stat(filePath);

    if (stat.isDirectory()) {
      const subfolderFiles = await findCSFiles(filePath);
      scriptFiles.push(...subfolderFiles);
    } else if (file.endsWith(".cs")) {
      const fileName = file.replace(".cs", "");
      const content = await fs.promises.readFile(filePath, "utf-8");

      // Trim and clean content
      let trimmedContent = content.replace(/\s+/g, " ");
      //trimmedContent = trimmedContent.replace(/\.(?=\s|\w+\(|[a-zA-Z_])/g, ". $1");
      trimmedContent = trimmedContent.replace(/\n/g, " ");

      const scriptFile: ScriptFile = {
        filename: fileName,
        content: trimmedContent,
        tokens: 0,
        chunks: [],
        length: trimmedContent.length // Calculate length after trimming
      };

      scriptFiles.push(scriptFile);
    }
  }

  return scriptFiles;
};

const getChunks = async (script: ScriptFile) => {
    const chunks: ScriptChunk[] = [];
    const content = script.content;
    const methodEndPattern = /}\s*(?=(?:public|private|protected|internal|static)?\s*(?:void|int|float|string|bool|char|double|byte|short|long|decimal|object)?\s*(?:[a-zA-Z_][\w<>]*)\s*\()/g;

    let contentTextChunks: string[] = [];

    if (encode(content).length > CHUNK_SIZE) {
        const split = content.split(methodEndPattern);
        let chunkText = "";

        for (let i = 0; i < split.length; i++) {
            const sentence = split[i];
            const sentenceTokenLength = encode(sentence);
            const chunkTextTokenLength = encode(chunkText).length;

            if (chunkTextTokenLength + sentenceTokenLength.length > CHUNK_SIZE) {
                contentTextChunks.push(chunkText);
                chunkText = "";
            }

            if (sentence[sentence.length - 1].match(/[a-z0-9]/i)) {
                chunkText += sentence + "}";
            } else {
                chunkText += sentence + " ";
            }
        }

        contentTextChunks.push(chunkText.trim());
    } else {
        contentTextChunks.push(content.trim());
    }

    // Create chunks from contentTextChunks
    for (const chunkContent of contentTextChunks) {
        const chunk: ScriptChunk = {
            cs_scriptfile: script.filename,
            content: chunkContent,
            content_tokens: encode(chunkContent).length,
            embedding: []
        };

        chunks.push(chunk);
    }

    return chunks;
};



(async () => {
  const scriptFiles = await findCSFiles(dungeonArchitectFolderPath);

    let scripts = [];
    for (let i = 0; i < scriptFiles.length; i++) {
        const script = scriptFiles[i];
        const chunks = await getChunks(script);
        script.chunks = chunks;
        scripts.push(script);
    }

  const json: ProjectJSON = {
    current_date: new Date().toISOString(),
    author: "Sanat", // Replace with your name
    tokens: 0,
    scripts: scriptFiles
  };

  // Calculate total tokens
  json.tokens = scriptFiles.reduce((acc, file) => acc + file.content.split(/\s+/).length, 0);

  // Write JSON to file in astana_games_codebase folder
  fs.mkdirSync(ASTANA_GAMES_CODEBASE, { recursive: true });
  
  fs.writeFileSync(`scripts/${ASTANA_GAMES_CODEBASE}/project_data_dungeon_architect.json`, JSON.stringify(json, null, 2));
})();
