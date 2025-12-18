import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const FRAMEWORK_RULES = {
  cypress: `
    FRAMEWORK: Cypress (JavaScript)
    STRICT FILE STRUCTURE:
    1. Spec Files: Must be in "cypress/e2e/..." with extension ".cy.js"
    2. Page Objects: Must be in "cypress/support/pages/..." with extension ".js"
    3. Fixtures: "cypress/fixtures/..."
    4. SYNTAX: Use cy.get(), cy.visit(), etc.
  `,
  playwright: `
    FRAMEWORK: Playwright (TypeScript)
    STRICT FILE STRUCTURE:
    1. Spec Files: Must be in "tests/e2e/..." with extension ".spec.ts"
    2. Page Objects: Must be in "pages/..." with extension ".ts" (DO NOT put in cypress folder!)
    3. Utils: "utils/..."
    4. SYNTAX: Use await page.locator(), await page.goto(), etc.
    5. FORBIDDEN: Do NOT use any folder named 'cypress'.
  `,
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      action, 
      testCase, 
      framework, 
      provider,
      currentCode, 
      errorMessage, 
      fileName,
      userApiKey 
    } = body;

    // --- SYSTEM PROMPTS (Reusable) ---
    const selectedRule = FRAMEWORK_RULES[framework] || FRAMEWORK_RULES.cypress;
    
    const generateSystemPrompt = `
      Role: Senior QA Automation Architect.
      Task: Generate a robust Page Object Model (POM) test structure.
      
      CRITICAL INSTRUCTIONS:
      1. Follow the "STRICT FILE STRUCTURE" below exactly.
      2. If Playwright is selected, NEVER create a 'cypress' folder.
      
      Response Format (JSON Only, Minified):
      {
        "risk_analysis": { "score": (1-10), "priority": "High/Medium/Low", "reasoning": "Bahasa Indonesia (if test case input in Indonesian) / English (if test case input in English)" },
        "lint_report": [],
        "generated_files": [ { "path": "path/to/file.ext", "content": "code..." } ]
      }

      CONTEXT & RULES:
      ${selectedRule}
    `;

    const fixSystemPrompt = `
      Role: Senior QA Code Reviewer.
      Task: Fix the provided code based on the error.
      Rules: Return ONLY the fixed code string. No markdown formatting.
    `;

    // PROVIDER 1: OPENAI (GPT-4o / GPT-3.5)
    if (provider === 'openai') {
        // Key: User Input -> Server Env
        const apiKey = userApiKey || process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            return NextResponse.json({ error: 'OpenAI API Key not found.' }, { status: 401 });
        }

        const openai = new OpenAI({ apiKey });
        
        let messages = [];
        if (action === 'fix') {
            messages = [
                { role: "system", content: fixSystemPrompt },
                { role: "user", content: `FILE: ${fileName}\nERROR: ${errorMessage}\nCODE:\n${currentCode}` }
            ];
        } else {
            messages = [
                { role: "system", content: generateSystemPrompt },
                { role: "user", content: `Test Case: ${testCase}` }
            ];
        }

        const completion = await openai.chat.completions.create({
            messages: messages,
            model: "gpt-4o", 
            response_format: action === 'fix' ? undefined : { type: "json_object" }
        });

        let result = completion.choices[0].message.content;
        
        if (action === 'fix') {
             result = result.replace(/^```[a-z]*\n/i, "").replace(/```$/g, "").trim();
        }

        return NextResponse.json({ result });
    }

    // PROVIDER 2: GOOGLE GEMINI (DEFAULT)
    else {
        const apiKey = userApiKey || process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API Key not found.' }, { status: 401 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: action === 'fix' ? "text/plain" : "application/json" },
            systemInstruction: action === 'fix' ? fixSystemPrompt : generateSystemPrompt
        });

        let prompt = "";
        if (action === 'fix') {
            prompt = `FILE: ${fileName}\nERROR: ${errorMessage}\nCODE:\n${currentCode}`;
        } else {
            prompt = testCase || "No test case";
        }

        const result = await model.generateContent(prompt);
        let resultText = result.response.text();

        if (action === 'fix') {
            resultText = resultText.replace(/^```[a-z]*\n/i, "").replace(/```$/g, "").trim();
        }

        return NextResponse.json({ result: resultText });
    }

  } catch (error) {
    console.error("ERROR BACKEND:", error);
    if (error.status === 429 || error.message?.includes('429')) {
       return NextResponse.json({ error: "API Quota Exceeded (Rate Limit)." }, { status: 429 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}