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
      userApiKey,
      preferences,
      htmlContext,
      imageData
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
             ${preferences.selectorType === 'data-testid' ? '- RULE: Use cy.get("[data-testid=\'value\']")' : ''}
             ${preferences.selectorType === 'id' ? '- RULE: Prefer IDs (#id) over classes.' : ''}
             
          2. QUOTE STYLE: 
             - FORCE: "${preferences.quoteStyle === 'single' ? "Single Quotes ('')" : "Double Quotes (\"\")"}"
             
          3. ASSERTION STYLE (CRITICAL):
             - MODE: "${preferences.assertionStyle}"
             ${preferences.assertionStyle === 'should' 
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

    // PROVIDER 1: OPENAI
    if (provider === 'openai') {
        const apiKey = userApiKey || process.env.OPENAI_API_KEY;
        if (!apiKey) return NextResponse.json({ error: 'OpenAI API Key not found.' }, { status: 401 });

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
                { role: "user", content: `Test Case: ${testCase}\n\nIMPORTANT REMINDER:\n${styleGuideInstruction}\n${contextInstruction}` }
            ];
        }

        const completion = await openai.chat.completions.create({
            messages: messages,
            model: "gpt-4o",
            response_format: action === 'fix' ? undefined : { type: "json_object" }
        });

        let result = completion.choices[0].message.content;
        if (action === 'fix') result = result.replace(/^```[a-z]*\n/i, "").replace(/```$/g, "").trim();

        return NextResponse.json({ result });
    }

    // PROVIDER 2: GOOGLE GEMINI
    else {
        const apiKey = userApiKey || process.env.GEMINI_API_KEY;
        if (!apiKey) return NextResponse.json({ error: 'Gemini API Key not found.' }, { status: 401 });

        const genAI = new GoogleGenerativeAI(apiKey);
        
        const geminiModel = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: action === 'fix' ? "text/plain" : "application/json" },
            systemInstruction: action === 'fix' ? fixSystemPrompt : generateSystemPrompt
        });

        // --- STEP 1: DRAFT GENERATION ---
        let promptParts = [];

        // 1. Image Part
        if (imageData && action !== 'fix') {
            const base64Data = imageData.split(',')[1];
            const mimeType = imageData.split(';')[0].split(':')[1];
            promptParts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            });
        }

        // 2. Text Part
        let textPrompt = "";
        if (action === 'fix') {
            textPrompt = `FILE: ${fileName}\nERROR: ${errorMessage}\nCODE:\n${currentCode}\n\nIMPORTANT: Maintain style!`;
        } else {
            textPrompt = `Test Case: ${testCase}\n\nIMPORTANT REMINDER:\n${styleGuideInstruction}\n${contextInstruction}`;
        }
        promptParts.push({ text: textPrompt });

        const draftResult = await geminiModel.generateContent(promptParts);
        let draftCode = draftResult.response.text();

        // --- STEP 2: SELF-CORRECTION (Refinement) ---
        if (action !== 'fix') {
             const refinementModel = genAI.getGenerativeModel({ 
                model: "gemini-2.5-flash",
                generationConfig: { responseMimeType: "application/json" } 
             });

             const refinementPrompt = `
               You are a QA Code Reviewer. You have just generated the following JSON output for a Test Automation project:
               
               ${draftCode}
               
               TASK: Review and Refine this JSON based on these strict criteria:
               1. SELECTOR ACCURACY: If HTML context was provided in the previous step, did the code use the EXACT IDs/Classes?
               2. CODING STYLE: Did the code strictly follow:
                  - Quote Style: ${preferences?.quoteStyle || 'Any'}
                  - Assertion Style: ${preferences?.assertionStyle || 'Any'}
               3. SYNTAX: Are there any syntax errors?
               
               OUTPUT: Return ONLY the corrected JSON. If the original was perfect, return it as is. Do NOT add markdown block.
             `;
             
             try {
                const refinedResult = await refinementModel.generateContent(refinementPrompt);
                draftCode = refinedResult.response.text();
             } catch (refineError) {
                console.warn("Refinement failed, using draft code.", refineError);
             }
        }

        let finalResult = draftCode;

        if (action === 'fix') {
            finalResult = finalResult.replace(/^```[a-z]*\n/i, "").replace(/```$/g, "").trim();
        } else {
             finalResult = finalResult.replace(/^```json\n/i, "").replace(/^```\n/i, "").replace(/```$/g, "").trim();
        }

        return NextResponse.json({ result: finalResult });
    }

  } catch (error) {
    console.error("ERROR BACKEND:", error);
    if (error.status === 429 || error.message?.includes('429')) {
       return NextResponse.json({ error: "API Quota Exceeded (Rate Limit)." }, { status: 429 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}