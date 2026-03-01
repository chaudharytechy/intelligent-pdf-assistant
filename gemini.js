import dotenv from "dotenv";
import { index } from "./pinecone.js";

dotenv.config();

const TOKEN = process.env.GEMINI_API_KEY;
const MODEL = "gemini-embedding-001";

// Generate embeddings from Gemini
export async function embedText(textArray) {
  const embeddings = [];

  for (let t of textArray) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": TOKEN,
        },
        body: JSON.stringify({
          model: `models/${MODEL}`,
          content: { parts: [{ text: t }] },
        }),
      }
    );

    const data = await res.json();
    const values = data?.embedding?.values;

    if (!values || values.length === 0) {
      console.error("No embedding returned for:", t);
      continue; // skip empty embeddings
    }

    embeddings.push(values);
  }

  if (embeddings.length === 0) {
    throw new Error("No embeddings returned — cannot upsert to Pinecone.");
  }

  return embeddings; // array of numeric arrays
}

// Main function: generate embeddings and upsert
export const embed = async (textInput) => {
  // Wrap single string in array
  const texts = typeof textInput === "string" ? [textInput] : textInput;

  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error("Input must be a string or non-empty array of strings");
  }

  // Generate embeddings
  const embeddings = await embedText(texts);

  // Prepare upsert items
  const items = embeddings.map((embedding, i) => ({
    id: `id_${Date.now()}_${i}`,
    values: embedding,
    metadata: { text: texts[i] },
  }));

  // Upsert to Pinecone
//   await index.('my-collection').upsert( items );
 await index.upsert({
  records: items
});
  console.log("Successfully upserted embeddings to Pinecone!");
  return embeddings;
};