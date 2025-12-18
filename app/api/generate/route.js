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
      testCase,
      framework,
      provider,
      model,
      currentCode,
      errorMessage,
      fileName,
      userApiKey,
      preferences,
      htmlContext,
    } = body;

    let htmlInstruction = "";
    if (htmlContext && htmlContext.trim().length > 0) {
      htmlInstruction = `
        <smart_context>
          The user has provided the ACTUAL HTML STRUCTURE of the page.
          You MUST use the selectors (IDs, Classes, Names) found in this HTML.
          Do NOT guess selectors if they are present here.
          
          [HTML SNIPPET START]
          ${htmlContext}
          [HTML SNIPPET END]
        </smart_context>
        `;
    }

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
                 ? `
               [MODE: CHAINED]
               - USE: cy.get(...).should('be.visible')
               - FORBIDDEN: expect(...)
               `
                 : `
               [MODE: EXPLICIT EXPECT]
               - RULE: Cypress is async. You MUST wrap assertions in .then().
               - WRONG: expect(cy.get(..)).to.exist
               - CORRECT PATTERN:
                 cy.get(selector).then(($el) => {
                    expect($el).to.be.visible;
                    expect($el).to.have.text("Value");
                 });
               - FORBIDDEN: .should()
               `
             }
        </coding_style_rules>
        `;
    }

    const selectedRule = FRAMEWORK_RULES[framework] || FRAMEWORK_RULES.cypress;

    // --- 3. SYSTEM PROMPT  ---
    const generateSystemPrompt = `
      Role: Senior QA Automation Architect.
      Task: Generate a robust Page Object Model (POM) test structure.
      
      ${styleGuideInstruction}
      ${htmlInstruction}

      CRITICAL INSTRUCTIONS:
      1. Follow the "STRICT FILE STRUCTURE" below exactly.
      2. If Playwright is selected, NEVER create a 'cypress' folder.
      3. Adhere strictly to the <coding_style_rules> defined above.
      
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
      
      ${styleGuideInstruction}

      Rules: 
      1. Return ONLY the fixed code string. No markdown formatting.
      2. Ensure the fixed code follows the <coding_style_rules>.
    `;

    // PROVIDER 1: OPENAI (GPT-4o / GPT-3.5)
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
      } else {
        messages = [
          { role: "system", content: generateSystemPrompt },
          {
            role: "user",
            content: `Test Case: ${testCase}\n\nREMINDER: Follow these style rules:\n${styleGuideInstruction}`,
          },
        ];
      }

      const completion = await openai.chat.completions.create({
        messages: messages,
        model: model || "gpt-4o",
        response_format: action === "fix" ? undefined : { type: "json_object" },
      });

      let result = completion.choices[0].message.content;
      if (action === "fix")
        result = result
          .replace(/^```[a-z]*\n/i, "")
          .replace(/```$/g, "")
          .trim();

      return NextResponse.json({ result });
    }

    // PROVIDER 2: GOOGLE GEMINI (DEFAULT)
    else {
      const apiKey = userApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey)
        return NextResponse.json(
          { error: "Gemini API Key not found." },
          { status: 401 }
        );

      const genAI = new GoogleGenerativeAI(apiKey);
      const selectedModelName = model || "gemini-2.5-flash";

      const geminiModel = genAI.getGenerativeModel({
        model: selectedModelName,
        generationConfig: {
          responseMimeType:
            action === "fix" ? "text/plain" : "application/json",
        },
        systemInstruction:
          action === "fix" ? fixSystemPrompt : generateSystemPrompt,
      });

      let prompt = "";
      if (action === "fix") {
        prompt = `FILE: ${fileName}\nERROR: ${errorMessage}\nCODE:\n${currentCode}\n\nIMPORTANT: Maintain the requested coding style!`;
      } else {
        prompt = `Test Case: ${testCase}\n\nIMPORTANT REMINDER:\n${styleGuideInstruction}`;
      }

      const result = await geminiModel.generateContent(prompt);
      let resultText = result.response.text();

      if (action === "fix") {
        resultText = resultText
          .replace(/^```[a-z]*\n/i, "")
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
