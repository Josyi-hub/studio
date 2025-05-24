
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting budget adjustments based on user spending habits.
 *
 * - suggestBudgetAdjustments - A function that takes in spending data and returns AI-powered budget adjustment suggestions.
 * - SuggestBudgetAdjustmentsInput - The input type for the suggestBudgetAdjustments function.
 * - SuggestBudgetAdjustmentsOutput - The return type for the suggestBudgetAdjustments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestBudgetAdjustmentsInputSchema = z.object({
  income: z.number().describe('The users monthly income.'),
  expenses: z.record(z.number()).describe('A record of the user\'s spending, with category names as keys and spending amounts as values.'),
  budgetGoals: z.record(z.number()).describe('A record of the user\'s budget goals, with category names as keys and budget amounts as values.'),
});
export type SuggestBudgetAdjustmentsInput = z.infer<typeof SuggestBudgetAdjustmentsInputSchema>;

const SuggestBudgetAdjustmentsOutputSchema = z.object({
  suggestions: z.record(z.string()).describe('A record of AI-powered budget adjustment suggestions, with category names as keys and suggestion strings as values.'),
});
export type SuggestBudgetAdjustmentsOutput = z.infer<typeof SuggestBudgetAdjustmentsOutputSchema>;

export async function suggestBudgetAdjustments(input: SuggestBudgetAdjustmentsInput): Promise<SuggestBudgetAdjustmentsOutput> {
  return suggestBudgetAdjustmentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestBudgetAdjustmentsPrompt',
  input: {schema: SuggestBudgetAdjustmentsInputSchema},
  output: { format: 'json' }, // Specify JSON output format instead of strict schema
  prompt: `You are a personal finance advisor specializing in helping people optimize their budgets.

  Based on the user's income, expenses, and budget goals, provide specific and actionable suggestions for adjusting their budget.

  Income: {{{income}}}
  Expenses: {{#each expenses}} {{key}}: {{{this}}} {{/each}}
  Budget Goals: {{#each budgetGoals}} {{key}}: {{{this}}} {{/each}}

  You must provide your response as a single JSON object.
  The JSON object must have a top-level key named "suggestions".
  The value of the "suggestions" key must be an object where each key is a budget category name (string) and its value is the suggestion string for that category.
  Each suggestion should be a short, actionable sentence.

  For example, the JSON output should look like this:
  {
    "suggestions": {
      "Food": "Reduce restaurant spending by 10% and allocate those funds to savings.",
      "Entertainment": "Limit entertainment expenses to $50 per month.",
      "Savings": "Increase monthly savings contributions by 5%."
    }
  }
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
        throw new Error("AI did not return any text output.");
      }
      try {
        parsedJson = JSON.parse(textOutput);
      } catch (e) {
        console.error("Failed to parse AI text output as JSON:", textOutput, e);
        throw new Error("AI output was not valid JSON and could not be parsed.");
      }
    }

    try {
      const validatedOutput = SuggestBudgetAdjustmentsOutputSchema.parse(parsedJson);
      return validatedOutput;
    } catch (e) {
      console.error("AI JSON output did not match expected schema:", parsedJson, e);
      throw new Error("AI output was JSON, but did not match the expected structure.");
    }
  }
);
