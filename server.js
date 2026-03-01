import express from "express";
import dotenv from "dotenv";
// import { askRAG } from "./rag.js";
// import embed from "./gemini.js"
import {embed }from "./gemini.js"
import { createRAGChain } from "./rag.js";
import { parseAndEmbed } from "./parser.js";
import { fileURLToPath } from "url";
dotenv.config();
const app = express();

app.use(express.json());

let ragChain;

(async () => {
  ragChain = await createRAGChain();
})();




app.post("/insertData", async (req, res) => {
  try {
    const { text } = req.body;
    // if (!text) return res.status(400).json({ error: "No text provided" });
console.log(text)
    const embeddings = await embed(text);
    res.json({ message: "Embeddings stored", embeddings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>RAG PDF QA</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          background: #f5f5f5;
        }
        .container {
          width: 70%;
          margin-top: 50px;
          background: #fff;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        h2 { color: #333; }
        input[type="file"], textarea, button {
          margin: 10px 0;
          padding: 12px;
          width: 100%;
          box-sizing: border-box;
          border-radius: 5px;
          border: 1px solid #ccc;
          font-size: 16px;
        }
        button {
          background-color: #007BFF;
          color: white;
          border: none;
          cursor: pointer;
          transition: background 0.3s;
        }
        button:disabled {
          background: #999;
          cursor: not-allowed;
        }
        button:hover:not(:disabled) {
          background-color: #0056b3;
        }
        #uploadResult, #answer {
          margin-top: 20px;
          padding: 15px;
          border-radius: 5px;
          background: #f0f0f0;
          border: 1px solid #ccc;
        }
        #answer h3 {
          margin: 0 0 10px 0;
          color: #007BFF;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Upload Document</h2>
        <form id="uploadForm">
          <input type="file" id="fileInput" name="file" />
          <button type="submit">Upload</button>
        </form>
        <div id="uploadResult"></div>

        <h2>Ask a Question</h2>
        <form id="askForm">
          <textarea id="questionInput" placeholder="Type your question..."></textarea>
          <button type="submit">Ask</button>
        </form>
        <div id="answer"></div>
      </div>

      <script>
        const uploadForm = document.getElementById('uploadForm');
        const uploadBtn = uploadForm.querySelector('button');
        uploadForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fileInput = document.getElementById('fileInput');
          if (!fileInput.files.length) return alert('Select a file first');

          const formData = new FormData();
          formData.append('file', fileInput.files[0]);

          uploadBtn.disabled = true;
          uploadBtn.innerText = "Uploading...";

          try {
            const res = await fetch('/uploadDocument', { method: 'POST', body: formData });
            const data = await res.json();
            document.getElementById('uploadResult').innerText = data.message || 'Document uploaded successfully';
          } catch (err) {
            document.getElementById('uploadResult').innerText = 'Upload failed';
          } finally {
            uploadBtn.disabled = false;
            uploadBtn.innerText = "Upload";
          }
        });

        const askForm = document.getElementById('askForm');
        const askBtn = askForm.querySelector('button');
        askForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const question = document.getElementById('questionInput').value.trim();
          if (!question) return alert('Type a question');

          askBtn.disabled = true;
          askBtn.innerText = "Waiting for answer...";

          try {
            const res = await fetch('/ask', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ question })
            });
            const data = await res.json();

            if(data.answer){
              document.getElementById('answer').innerHTML = \`
                <h3>ANSWER</h3>
                <p>\${data.answer}</p>
              \`;
            } else {
              document.getElementById('answer').innerHTML = '<p>No answer received.</p>';
            }
          } catch (err) {
            document.getElementById('answer').innerHTML = '<p>Failed to get answer.</p>';
          } finally {
            askBtn.disabled = false;
            askBtn.innerText = "Ask";
          }
        });
      </script>
    </body>
    </html>
  `);
});
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
// console.log(question,"p")
    const response = await ragChain.invoke({
      question,
    });

    res.json({ answer: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
})

import multer from "multer";
import path from "path";

// Multer setup
const upload = multer({ dest: "uploads/"});
// Upload route
app.post("/uploadDocument", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const ext = path.extname(file.originalname).toLowerCase();
    let type;
    if (ext === ".pdf") type = "pdf";
    else if (ext === ".docx") type = "docx";
    else if (ext === ".txt") type = "text";
    else return res.status(400).json({ error: "Unsupported file type" });

   
  const embeddings = await parseAndEmbed(file.path, type);
res.json({ message: "Document processed successfully", preview: embeddings.preview });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Document parsing failed" });
  }
});


app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

