import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const FRAMEWORK_RULES = {
  cypress: "Output: Cypress (JS). Structure: /cypress/e2e (Specs), /cypress/pages (POM), /cypress/fixtures (Data).",
  playwright: "Output: Playwright (TS). Structure: /tests (Specs), /pages (POM), /utils (Data).",
  // robot: "Output: Robot Framework. Structure: /tests (.robot), /resources (Keywords), /variables."
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, testCase, framework, currentCode, errorMessage, fileName } = body;
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API Key belum diset di .env.local' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const MODEL_NAME = "gemini-2.5-flash"; 

    if (action === 'fix') {
      console.log(`Fixing file: ${fileName}`);

      if (!currentCode || !errorMessage) {
        throw new Error("Data code atau error message kosong.");
      }

      if (errorMessage.length > 500) {
        throw new Error("Error message terlalu panjang. Maksimal 500 karakter.");
      }

      if (currentCode.length > 8000) {
        
      }

      const fixPrompt = `
        Role: Senior QA Code Reviewer.
        Task: Fix the following code based on the specific linting error provided.
        
        File Name: ${fileName}
        Error to Fix: "${errorMessage}"
        
        Current Code:
        \`\`\`
        ${currentCode}
        \`\`\`

        Rules:
        1. ONLY return the fixed code. Do not add explanations, conversation, or markdown backticks.
        2. Keep the rest of the code intact, only fix the specific error.
        3. Ensure the fix follows best practices.
      `;

      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      
      const result = await model.generateContent(fixPrompt);
      const response = await result.response;
      let fixedCode = response.text();
      
      fixedCode = fixedCode.replace(/```[a-z]*\n/g, "").replace(/```/g, "").trim();
      
      return NextResponse.json({ result: fixedCode });
    }

    // --- MODE 2 ---
    console.log(`Generating structure for: ${framework}`);
    
    const selectedRule = FRAMEWORK_RULES[framework] || FRAMEWORK_RULES.cypress;
    const systemInstruction = `
      Role: Senior QA Automation Architect & Code Reviewer (Indonesian Native Speaker).
      Tugas: Analisa Risiko (RBT), Generate FULL POM, Code Review.
      
      ATURAN BAHASA:
      1. Reasoning & Linter Message: WAJIB Bahasa Indonesia.
      2. Priority: Bahasa Inggris (High/Medium/Low).
      
      Format Output JSON:
      {
        "risk_analysis": {
          "score": (1-10),
          "priority": "High" | "Medium" | "Low",
          "test_type": "Sanity" | "Regression" | "Smoke",
          "reasoning": "..."
        },
        "lint_report": [
           {
             "severity": "Error" | "Warning" | "Good",
             "message": "...",
             "file": "nama_file.js"
           }
        ],
        "generated_files": [
          {
            "path": "cypress/pages/LoginPage.js",
            "content": "..."
          }
        ]
      }
      Context: ${selectedRule}
    `;

    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      systemInstruction: systemInstruction,
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(testCase || "No test case provided");
    const response = await result.response;
    
    return NextResponse.json({ result: response.text() });

  } catch (error) {
    console.error("ERROR BACKEND:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}