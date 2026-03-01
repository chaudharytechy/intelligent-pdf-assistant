import dotenv from "dotenv"
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
dotenv.config()
export async function createRAGChain() {
    // 1. Embeddings (MUST match what you used to store vectors)

    const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "gemini-embedding-001", // Gemini embedding model
        apiKey: process.env.GEMINI_API_KEY
    });

    // 2. Pinecone connection
    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    });

    const index = pinecone.Index(process.env.PINECONE_INDEX);

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex: index,
    });

    const retriever = vectorStore.asRetriever({ k: 4 });

    // 3. Gemini LLM
    const llm = new ChatGoogleGenerativeAI({
        model: "gemini-3-flash-preview",
        temperature: 0,
        apiKey: process.env.GEMINI_API_KEY
    });

    // 4. Prompt
    const prompt = ChatPromptTemplate.fromTemplate(`
Answer the question using ONLY the context below.
If the answer is not in the context, say you don't know.

Context:
{context}

Question:
{question}
`);

    // 5. RAG Chain
    const chain = RunnableSequence.from([
        {
            context: async (input) => {
                // const docs = await retriever.getRelevantDocuments(input.question);
                const docs = await retriever.invoke(input.question);
                return docs.map((d) => d.pageContent).join("\n\n");
            },
            question: (input) => input.question,
        },
        prompt,
        llm,
        new StringOutputParser(),
    ]);

    return chain;
}