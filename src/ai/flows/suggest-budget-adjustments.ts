
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting budget adjustments based on user spending habits, language, and financial context.
 *
 * - suggestBudgetAdjustments - A function that takes in spending data, language, and context, then returns AI-powered budget adjustment suggestions.
 * - SuggestBudgetAdjustmentsInput - The input type for the suggestBudgetAdjustments function, now includes language and financialContext.
 * - SuggestBudgetAdjustmentsOutput - The return type for the suggestBudgetAdjustments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { SuggestBudgetAdjustmentsInput, SuggestBudgetAdjustmentsOutput } from '@/lib/types'; // Import from types

const SuggestBudgetAdjustmentsInputSchema = z.object({
  income: z.number().describe('The users monthly income.'),
  expenses: z.record(z.string(), z.number()).describe('A record of the user\'s spending, with category names as keys and spending amounts as values.'),
  budgetGoals: z.record(z.string(), z.number()).describe('A record of the user\'s budget goals, with category names as keys and budget amounts as values.'),
  language: z.string().describe('The language for the AI to respond in (e.g., "en-US", "fr-FR").'),
  financialContext: z.string().optional().describe('Optional additional financial context or goals provided by the user.'),
});

const SuggestBudgetAdjustmentsOutputSchema = z.object({
  suggestions: z.record(z.string(), z.string()).describe('A record of AI-powered budget adjustment suggestions, with category names as keys and suggestion strings as values.'),
});

export async function suggestBudgetAdjustments(input: SuggestBudgetAdjustmentsInput): Promise<SuggestBudgetAdjustmentsOutput> {
  // Validate input with Zod before calling the flow (good practice)
  const validatedInput = SuggestBudgetAdjustmentsInputSchema.parse(input);
  return suggestBudgetAdjustmentsFlow(validatedInput);
}

const prompt = ai.definePrompt({
  name: 'suggestBudgetAdjustmentsPrompt',
  input: {schema: SuggestBudgetAdjustmentsInputSchema},
  output: { format: 'json' }, // Specify JSON output format
  prompt: `You are a personal finance advisor specializing in helping people optimize their budgets.
Please provide your response in {{language}}.

Based on the user's income, expenses, budget goals, and financial context, provide specific and actionable suggestions for adjusting their budget.

User's Financial Profile:
Income: {{{income}}}
Expenses: 
{{#each expenses}}
  - {{key}}: {{{this}}}
{{/each}}
Budget Goals: 
{{#each budgetGoals}}
  - {{key}}: {{{this}}}
{{/each}}
{{#if financialContext}}
Financial Context/Goals: {{{financialContext}}}
{{/if}}

You MUST provide your response as a single JSON object.
The JSON object MUST have a top-level key named "suggestions".
The value of the "suggestions" key MUST be an object where each key is a budget category name (string) and its value is the suggestion string for that category.
Each suggestion should be a short, actionable sentence in {{language}}.

Example JSON output (for en-US):
{
  "suggestions": {
    "Food": "Consider reducing restaurant spending by 10% and allocate those funds to savings.",
    "Entertainment": "You could limit entertainment expenses to $50 per month to meet your goals.",
    "Savings": "Based on your goals, try increasing monthly savings contributions by 5%."
  }
}
If no specific suggestions can be made for a category based on the input, do not include that category in the "suggestions" object. If no suggestions can be made at all, return an empty "suggestions" object: { "suggestions": {} }.
`,
});

const suggestBudgetAdjustmentsFlow = ai.defineFlow(
  {
    name: 'suggestBudgetAdjustmentsFlow',
    inputSchema: SuggestBudgetAdjustmentsInputSchema,
    outputSchema: SuggestBudgetAdjustmentsOutputSchema,
  },
  async (input: SuggestBudgetAdjustmentsInput): Promise<SuggestBudgetAdjustmentsOutput> => {
    const genResponse = await prompt(input);

    let parsedJson: any;

    if (genResponse.output?.jsonOutput) {
      parsedJson = genResponse.output.jsonOutput;
    } else {
      const textOutput = genResponse.text;
      if (!textOutput) {
        console.error("AI did not return any text output for budget suggestions.");
        // Return empty suggestions to prevent app crash, client can handle this.
        return { suggestions: {} }; 
      }
      try {
        // Attempt to extract JSON from potentially messy text output
        const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch && jsonMatch[0]) {
          parsedJson = JSON.parse(jsonMatch[0]);
        } else {
          console.error("No valid JSON found in AI text output:", textOutput);
          return { suggestions: {} };
        }
      } catch (e) {
        console.error("Failed to parse AI text output as JSON for budget suggestions:", textOutput, e);
        return { suggestions: {} };
      }
    }
    
    // Validate the parsed JSON against the Zod schema
    try {
      const validatedOutput = SuggestBudgetAdjustmentsOutputSchema.parse(parsedJson);
      return validatedOutput;
    } catch (e) {
      console.error("AI JSON output did not match expected schema for budget suggestions:", parsedJson, e);
      // If validation fails, return empty suggestions to avoid breaking the client.
      // The client-side should ideally inform the user if suggestions are empty or an error occurred.
      return { suggestions: {} };
    }
  }
);
