import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config();

// const pc = new Pinecone({
//   apiKey: process.env.PINECONE_API_KEY,
// });

// // connect to index (must exist)
// export const index = pc.index(process.env.PINECONE_INDEX);
// import { PineconeClient } from '@pinecone-database/pinecone';

// const pc = new PineconeClient();
// await pc.init({
//   apiKey: process.env.PINECONE_API_KEY,
//   environment: process.env.PINECONE_ENVIRONMENT, // e.g., "us-east1-gcp"
// });

// export const index = pc.Index(process.env.PINECONE_INDEX); // only index name


// import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
export const index = pc.index("rag-chatbot");