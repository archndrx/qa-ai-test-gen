import { NextResponse } from "next/server";
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
      fixtureRequest,
      fixtureFormat,
      testCase,
      framework,
      provider,
      currentCode,
      refineInstruction,
      errorMessage,
      fileName,
      userApiKey,
      preferences,
      htmlContext,
      imageData,
    } = body;

    // --- 1. BUILD STYLE GUIDE ---
    let styleGuideInstruction = "";
    if (preferences) {
      styleGuideInstruction = `
        <coding_style_rules>
          IMPORTANT: You are configured to use a SPECIFIC CODING STYLE.
          Do NOT revert to default Cypress patterns.
          
          1. SELECTOR STRATEGY: 
             - PREFERRED: "${preferences.selectorType}"
             ${
               preferences.selectorType === "data-testid"
                 ? "- RULE: Use cy.get(\"[data-testid='value']\")"
                 : ""
             }
             ${
               preferences.selectorType === "id"
                 ? "- RULE: Prefer IDs (#id) over classes."
                 : ""
             }
             
          2. QUOTE STYLE: 
             - FORCE: "${
               preferences.quoteStyle === "single"
                 ? "Single Quotes ('')"
                 : 'Double Quotes ("")'
             }"
             
          3. ASSERTION STYLE (CRITICAL):
             - MODE: "${preferences.assertionStyle}"
             ${
               preferences.assertionStyle === "should"
                 ? `[MODE: CHAINED] USE: cy.get(...).should('be.visible'). FORBIDDEN: expect(...)`
                 : `[MODE: EXPLICIT EXPECT] RULE: Cypress is async. WRAP in .then(). CORRECT: cy.get(selector).then(($el) => { expect($el).to.be.visible; }); FORBIDDEN: .should()`
             }
        </coding_style_rules>
        `;
    }

    // --- 2. BUILD CONTEXT INSTRUCTIONS (HTML & IMAGE) ---
    let contextInstruction = "";

    if (htmlContext && htmlContext.trim().length > 0) {
      contextInstruction += `
        <html_context>
          The user provided an HTML snippet. USE THESE EXACT SELECTORS (IDs, Classes).
          ${htmlContext}
        </html_context>
        `;
    }

    if (imageData) {
      contextInstruction += `
        <visual_context>
          An image of the UI has been provided.
          TASK: Analyze the image to identify interactive elements (buttons, inputs) and their likely purpose.
          COMBINE this visual understanding with the Test Case description to generate the script.
        </visual_context>
        `;
    }

    const selectedRule = FRAMEWORK_RULES[framework] || FRAMEWORK_RULES.cypress;

    // --- SYSTEM PROMPTS ---
    const generateSystemPrompt = `
      Role: Senior QA Automation Architect.
      Task: Generate a robust Page Object Model (POM) test structure.
      
      ${styleGuideInstruction}
      ${contextInstruction}

      CRITICAL INSTRUCTIONS:
      1. Follow the "STRICT FILE STRUCTURE" below exactly.
      2. If Playwright is selected, NEVER create a 'cypress' folder.
      3. Adhere strictly to the <coding_style_rules>.
      
      [FEW-SHOT EXAMPLES]
      - Bad Input: "Login page" -> Output: cy.get('input').type('user') (Too generic)
      - Good Input: "Login page with HTML <input id='user'>" -> Output: 
         class LoginPage { 
           get username() { return cy.get('#user'); } 
         }

      Response Format (JSON Only, Minified):
      {
        "risk_analysis": { "score": (1-10), "priority": "High/Medium/Low", "reasoning": "Bahasa Indonesia (if the input is in Indonesian) / English (if the input is in English)" },
        "lint_report": [],
        "generated_files": [ { "path": "path/to/file.ext", "content": "code..." } ]
      }

      CONTEXT & RULES:
      ${selectedRule}
    `;

    const fixSystemPrompt = `
      Role: Senior QA Code Reviewer.
      Task: Fix the provided code based on the error.
      ${styleGuideInstruction}
      Rules: Return ONLY the fixed code string. No markdown formatting.
    `;

    const refineSystemPrompt = `
      Role: Senior QA Code Refactorer.
      Task: Modify the provided Automation Code based strictly on the User's Instruction.
      
      ${styleGuideInstruction}
      
      RULES:
      1. Return ONLY the updated code string. No markdown, no explanations.
      2. Maintain the existing structure/logic unless asked to change.
      3. Do NOT hallucinate new files. Just edit the provided code.
      4. If the instruction is impossible, return the original code.
    `;

    const explainSystemPrompt = `
      Role: Expert Tech Lead & Coding Mentor.
      Task: Explain the provided code snippet clearly and concisely.
      
      LANGUAGE INSTRUCTION (CRITICAL):
      1. Analyze the input code (comments, variable names, strings).
      2. If the code uses **Indonesian** terms (e.g., variable "daftarUser", comments "// login berhasil"), output the explanation in **BAHASA INDONESIA**.
      3. If the code is standard English, output in **ENGLISH**.
      4. If unsure, default to **ENGLISH**.

      RULES:
      1. Explain WHAT the code does and WHY.
      2. Explain specific Cypress/Playwright commands briefly.
      3. Keep it short (2-3 paragraphs max).
      4. Use bullet points for key concepts.
      5. Tone: Encouraging & Educational.
    `;

    const fixtureSystemPrompt = `
      Role: Expert Data Generator for QA Testing.
      Task: Generate realistic mock data based on user requirements.
      
      CRITICAL OUTPUT RULES:
      1. Output ONLY the raw data. DO NOT wrap in markdown code blocks (no \`\`\`json).
      2. If format is JSON, return a valid JSON array/object.
      3. If format is SQL, return valid INSERT statements.
      4. If format is CSV, return valid comma-separated values with headers.
      5. Ensure data consistency (e.g., email matches name).
      6. Use realistic data (names, addresses, dates), not "test1", "test2".
    `;

    // PROVIDER 1: OPENAI
    if (provider === "openai") {
      const apiKey = userApiKey || process.env.OPENAI_API_KEY;
      if (!apiKey)
        return NextResponse.json(
          { error: "OpenAI API Key not found." },
          { status: 401 }
        );

      const openai = new OpenAI({ apiKey });

      let messages = [];
      if (action === "fix") {
        messages = [
          { role: "system", content: fixSystemPrompt },
          {
            role: "user",
            content: `FILE: ${fileName}\nERROR: ${errorMessage}\nCODE:\n${currentCode}`,
          },
        ];
      } else if (action === "refine") {
        messages = [
          { role: "system", content: refineSystemPrompt },
          {
            role: "user",
            content: `CURRENT CODE:\n${currentCode}\n\nUSER INSTRUCTION: ${refineInstruction}`,
          },
        ];
      } else if (action === "explain") {
        messages = [
          { role: "system", content: explainSystemPrompt },
          { role: "user", content: `EXPLAIN THIS CODE:\n${currentCode}` },
        ];
      } else if (action === "generate_fixture") {
        messages = [
          { role: "system", content: fixtureSystemPrompt },
          {
            role: "user",
            content: `GENERATE ${fixtureFormat.toUpperCase()} DATA:\nRequest: ${fixtureRequest}`,
          },
        ];
      } else {
        messages = [
          { role: "system", content: generateSystemPrompt },
          {
            role: "user",
            content: `Test Case: ${testCase}\n\nIMPORTANT REMINDER:\n${styleGuideInstruction}\n${contextInstruction}`,
          },
        ];
      }

      const completion = await openai.chat.completions.create({
        messages: messages,
        model: "gpt-4o",
        response_format:
          action === "generate" ? { type: "json_object" } : undefined,
      });

      let result = completion.choices[0].message.content;
      if (action === "fix" || action === "refine") {
        result = result
          .replace(/^```[a-z]*\n/i, "")
          .replace(/```$/g, "")
          .trim();
      }

      return NextResponse.json({ result });
    }

    // PROVIDER 2: GOOGLE GEMINI
    else {
      const apiKey = userApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey)
        return NextResponse.json(
          { error: "Gemini API Key not found." },
          { status: 401 }
        );

      const genAI = new GoogleGenerativeAI(apiKey);

      let activeSystemPrompt = generateSystemPrompt;
      if (action === "fix") activeSystemPrompt = fixSystemPrompt;
      if (action === "refine") activeSystemPrompt = refineSystemPrompt;
      if (action === "explain") activeSystemPrompt = explainSystemPrompt;
      if (action === "generate_fixture")
        activeSystemPrompt = fixtureSystemPrompt;

      const geminiModel = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType:
            action === "generate" ||
            (action === "generate_fixture" && fixtureFormat === "json")
              ? "application/json"
              : "text/plain",
        },
        systemInstruction: activeSystemPrompt,
      });

      let promptParts = [];

      if (action === "refine") {
        promptParts.push({
          text: `CURRENT CODE:\n${currentCode}\n\nUSER INSTRUCTION: ${refineInstruction}`,
        });
      } else if (action === "fix") {
        promptParts.push({
          text: `FILE: ${fileName}\nERROR: ${errorMessage}\nCODE:\n${currentCode}\n\nIMPORTANT: Maintain style!`,
        });
      } else if (action === "explain") {
        promptParts.push({ text: `EXPLAIN THIS CODE:\n${currentCode}` });
      } else if (action === "generate_fixture") {
        promptParts.push({
          text: `GENERATE ${fixtureFormat.toUpperCase()} DATA:\nRequest: ${fixtureRequest}`,
        });
      } else {
        // 1. Image Part
        if (imageData) {
          const base64Data = imageData.split(",")[1];
          const mimeType = imageData.split(";")[0].split(":")[1];
          promptParts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          });
        }
        // 2. Text Part
        promptParts.push({
          text: `Test Case: ${testCase}\n\nIMPORTANT REMINDER:\n${styleGuideInstruction}\n${contextInstruction}`,
        });
      }

      // --- Execute Gemini ---
      const draftResult = await geminiModel.generateContent(promptParts);
      let resultText = draftResult.response.text();

      if (action === "generate") {
        const refinementModel = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: { responseMimeType: "application/json" },
        });

        const correctionPrompt = `
               You are a QA Code Reviewer. You have just generated the following JSON output:
               
               ${resultText}
               
               TASK: Review and Refine this JSON based on these strict criteria:
               1. SELECTOR ACCURACY: If HTML context was provided, did the code use the EXACT IDs/Classes?
               2. CODING STYLE: Did the code strictly follow:
                  - Quote Style: ${preferences?.quoteStyle || "Any"}
                  - Assertion Style: ${preferences?.assertionStyle || "Any"}
               3. SYNTAX: Are there any syntax errors?
               
               OUTPUT: Return ONLY the corrected JSON. If original is perfect, return it.
             `;

        try {
          const refinedResult = await refinementModel.generateContent(
            correctionPrompt
          );
          resultText = refinedResult.response.text();
        } catch (refineError) {
          console.warn(
            "Self-correction failed, using draft code.",
            refineError
          );
        }
      }

      if (action === "fix" || action === "refine") {
        resultText = resultText
          .replace(/^```[a-z]*\n/i, "")
          .replace(/```$/g, "")
          .trim();
      } else {
        resultText = resultText
          .replace(/^```json\n/i, "")
          .replace(/^```\n/i, "")
          .replace(/```$/g, "")
          .trim();
      }

      return NextResponse.json({ result: resultText });
    }
  } catch (error) {
    console.error("ERROR BACKEND:", error);
    if (error.status === 429 || error.message?.includes("429")) {
      return NextResponse.json(
        { error: "API Quota Exceeded (Rate Limit)." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
