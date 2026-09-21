const fs = require('fs');
let code = fs.readFileSync('server_clean.ts', 'utf8');

const tail = `    res.status(500).json({ error: "Failed to retrieve document content: " + err.message });
  }
});

// 27. POST AI Coach File & Evidence Analysis Gate
app.post("/api/cbridge-ai/coach-file-analysis", async (req: any, res: any) => {
  try {
    const {
      sessionId,
      projectId = "PRJ-324",
      moduleId = "MA-324-01",
      learnerMessage,
      activeObjective,
      userRole
    } = req.body;

    if (!sessionId || !learnerMessage) {
      return res.status(400).json({ error: "sessionId and learnerMessage are required." });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({ error: "AI client not configured." });
    }

    const result = await executeCoachDocumentAnalysis({
      sessionId,
      projectId,
      moduleId,
      learnerMessage,
      activeObjective,
      userRole,
      aiClient: ai
    });

    return res.json({
      success: true,
      result
    });
  } catch (err: any) {
    console.error("Coach File Analysis Error:", err);
    res.status(500).json({ error: "Failed to analyze document: " + err.message });
  }
});

// 28. GET Document Intelligence Diagnostics
app.get("/api/diagnostics/document-intelligence", (req: any, res: any) => {
  try {
    const logs = getDocumentIntelligenceDiagnostics();
    return res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/cbridge-ai/run-blind-document-tests", async (req: any, res: any) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({ error: "AI client not initialized" });
    }
    const report = await runCrossProjectBlindDocumentTestSuite(ai);
    return res.json({ success: true, report });
  } catch (err: any) {
    console.error("Blind Test Suite Error:", err);
    res.status(500).json({ error: "Failed to run test suite: " + err.message });
  }
});

  // ============================================================================
  // Vite Middleware & Static Serving
  // ============================================================================
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite in development mode...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on http://0.0.0.0:\${PORT}\`);
  });
`;

fs.writeFileSync("server_restored.ts", code + tail);
console.log("Restored server.ts into server_restored.ts");
