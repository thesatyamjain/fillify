export type BlankType = 'text' | 'longtext' | 'number' | 'date' | 'currency' | 'dropdown' | 'checkbox';

export interface Blank {
  id: string;
  label: string;
  type: BlankType;
  order: number;
  required: boolean;
  defaultValue?: string;
  helpText?: string;
  options?: string[]; // for dropdown
  linkedGroup?: string; // blanks sharing identical label populate together
}

export interface Template {
  id: string;
  name: string;
  category?: string;
  createdAt: number;
  updatedAt: number;
  bodyText: string; // raw text with {{blank_id}} placeholders
  blanks: Blank[];
}

export interface FilledInstance {
  id: string;
  templateId: string;
  templateName: string;
  filledAt: number;
  values: Record<string, string>;
  finalText: string;
}

export interface SuggestedBlank {
  spanText: string;
  startIndex: number;
  endIndex: number;
  suggestedLabel: string;
  suggestedType: BlankType;
}
