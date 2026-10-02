import { Template, FilledInstance } from '../types/template';

const STORAGE_KEYS = {
  TEMPLATES: 'fillify_saved_templates_v3',
  CURRENT_TEMPLATE_ID: 'fillify_current_template_id_v3',
  FILLED_HISTORY: 'fillify_filled_history_v3',
};

// Fixed epoch offsets so timestamps don't change on every module import / hot reload.
const _BASE = 1700000000000; // 2023-11-14 — stable reference
export const SAMPLE_TEMPLATES: Template[] = [
  {
    id: 'sample-legal-nda',
    name: 'Legal — Mutual Non-Disclosure Agreement',
    category: 'Legal',
    createdAt: _BASE - 86400000 * 3,
    updatedAt: _BASE - 86400000 * 3,
    bodyText: `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement (the "Agreement") is entered into on {{b1}} (the "Effective Date") by and between:

Party A: {{b2}}, with a principal place of business at {{b3}} ("Disclosing Party"), and
Party B: {{b4}}, with a principal place of business at {{b5}} ("Receiving Party").

1. PURPOSE OF DISCLOSURE
The parties wish to explore a potential business relationship concerning {{b6}} (the "Purpose"). In connection with the Purpose, each party may disclose certain confidential information to the other.

2. CONFIDENTIAL INFORMATION
"Confidential Information" includes, but is not limited to, trade secrets, financial data, business plans, algorithms, and software architecture.

3. DURATION AND GOVERNING LAW
This Agreement shall remain in effect for a period of {{b7}} months from the Effective Date. In the event of a breach, liquidated damages shall not exceed {{b8}}. This Agreement shall be governed by the laws of {{b9}}.

Are external audits permitted under this agreement? {{b10}}

Signed for Party A: ____________________
Signed for Party B: ____________________`,
    blanks: [
      { id: 'b1', label: 'Effective Date', type: 'date', order: 1, required: true },
      { id: 'b2', label: 'Party A Name', type: 'text', order: 2, required: true, defaultValue: 'Acme Corp Ltd.' },
      { id: 'b3', label: 'Party A Address', type: 'longtext', order: 3, required: true },
      { id: 'b4', label: 'Party B Name', type: 'text', order: 4, required: true },
      { id: 'b5', label: 'Party B Address', type: 'longtext', order: 5, required: true },
      { id: 'b6', label: 'Project Purpose', type: 'longtext', order: 6, required: true, helpText: 'Describe the nature of the partnership' },
      { id: 'b7', label: 'Duration (Months)', type: 'number', order: 7, required: true, defaultValue: '24' },
      { id: 'b8', label: 'Liability Cap', type: 'currency', order: 8, required: true, defaultValue: '100000' },
      { id: 'b9', label: 'Jurisdiction', type: 'text', order: 9, required: true, defaultValue: 'Delaware' },
      { id: 'b10', label: 'Audits Permitted', type: 'checkbox', order: 10, required: true },
    ],
  },
  {
    id: 'sample-freelance-contract',
    name: 'Business — Freelance Services Contract',
    category: 'Business',
    createdAt: _BASE - 86400000 * 2,
    updatedAt: _BASE - 86400000 * 2,
    bodyText: `FREELANCE SERVICES CONTRACT

CLIENT: {{b1}}
CONTRACTOR: {{b2}}
DATE: {{b3}}

1. SCOPE OF WORK
The Contractor agrees to perform the following services (the "Services") in a professional and timely manner:
{{b4}}

2. TIMELINE AND DELIVERABLES
The Services will commence on {{b5}} and shall be completed no later than {{b6}}.
- Milestone 1 Delivery: {{b7}}
- Final Project Delivery: {{b8}}

3. COMPENSATION & PAYMENT TERMS
The Client agrees to pay the Contractor a total fixed fee of {{b9}} for the Services. 
Payment is due within {{b10}} days of invoice receipt. 

Is this project eligible for a performance bonus? {{b11}}

Signatures:
Client: _______________    Contractor: _______________`,
    blanks: [
      { id: 'b1', label: 'Client Name', type: 'text', order: 1, required: true },
      { id: 'b2', label: 'Contractor Name', type: 'text', order: 2, required: true },
      { id: 'b3', label: 'Contract Date', type: 'date', order: 3, required: true },
      { id: 'b4', label: 'Scope of Work', type: 'longtext', order: 4, required: true, helpText: 'Detailed description of the deliverables' },
      { id: 'b5', label: 'Start Date', type: 'date', order: 5, required: true },
      { id: 'b6', label: 'End Date', type: 'date', order: 6, required: true },
      { id: 'b7', label: 'Milestone 1 Date', type: 'date', order: 7, required: true },
      { id: 'b8', label: 'Final Delivery Date', type: 'date', order: 8, required: true },
      { id: 'b9', label: 'Total Fee', type: 'currency', order: 9, required: true },
      { id: 'b10', label: 'Net Payment Terms', type: 'dropdown', order: 10, required: true, options: ['15', '30', '45', '60'], defaultValue: '15' },
      { id: 'b11', label: 'Bonus Eligible?', type: 'checkbox', order: 11, required: false },
    ],
  },
  {
    id: 'sample-account-audit',
    name: 'CS — Client Account Audit Report',
    category: 'Customer Success',
    createdAt: _BASE - 86400000,
    updatedAt: _BASE - 86400000,
    bodyText: `ACCOUNT AUDIT & REVIEW SUMMARY

Client Name: {{b1}}
Account Manager: {{b2}}
Review Date: {{b3}}
Account Health Status: {{b4}}

EXECUTIVE SUMMARY
Over the past quarter, {{b1}} has seen a significant change in platform usage. We identified {{b5}} active monthly users, representing a growth of {{b6}}%.

STRATEGIC RECOMMENDATIONS
Based on the current trajectory and product adoption metrics, we recommend the following next steps:
{{b7}}

Will the client upgrade their subscription tier this quarter? {{b8}}
If upgrading, the projected new recurring revenue will be {{b9}}.

Report generated by Fillify Automated Insights.`,
    blanks: [
      { id: 'b1', label: 'Client Name', type: 'text', order: 1, required: true },
      { id: 'b2', label: 'Account Manager', type: 'text', order: 2, required: true },
      { id: 'b3', label: 'Review Date', type: 'date', order: 3, required: true },
      { id: 'b4', label: 'Health Status', type: 'dropdown', order: 4, required: true, options: ['Healthy', 'At Risk', 'Churn Warning', 'Scaling'], defaultValue: 'Healthy' },
      { id: 'b5', label: 'Active Users', type: 'number', order: 5, required: true },
      { id: 'b6', label: 'Growth Percentage', type: 'number', order: 6, required: true },
      { id: 'b7', label: 'Recommendations', type: 'longtext', order: 7, required: true },
      { id: 'b8', label: 'Upgrading Tier?', type: 'checkbox', order: 8, required: true },
      { id: 'b9', label: 'Projected MRR', type: 'currency', order: 9, required: false },
    ],
  },
  {
    id: 'sample-indic-hindi',
    name: 'हिंदी — सेवा आवेदन पत्र (Service Application)',
    category: 'Government & Services',
    createdAt: _BASE,
    updatedAt: _BASE,
    bodyText: `सेवा में,
श्रीमान {{b1}},
{{b2}}
{{b3}}

विषय: {{b4}} हेतु आवेदन पत्र

महोदय,
सविनय निवेदन है कि मैं {{b5}}, निवासी {{b6}}, दिनांक {{b7}} से {{b4}} की सेवा का अनुरोध करता/करती हूँ। 

आवेदक की जानकारी इस प्रकार है:
- संपर्क नंबर: {{b8}}
- ईमेल आईडी: {{b9}}
- आवेदन शुल्क: {{b10}}

कृपया मेरे आवेदन पर विचार कर उचित कार्रवाई करने की कृपा करें। 
क्या सभी आवश्यक दस्तावेज़ संलग्न हैं? {{b11}}

धन्यवाद,
भवदीय / भवदीया
{{b5}}
दिनांक: {{b7}}`,
    blanks: [
      { id: 'b1', label: 'अधिकारी का नाम (Officer Name)', type: 'text', order: 1, required: true, defaultValue: 'शाखा प्रबंधक' },
      { id: 'b2', label: 'विभाग का नाम (Department)', type: 'text', order: 2, required: true, defaultValue: 'जन सेवा केंद्र' },
      { id: 'b3', label: 'शहर / जिला (City/District)', type: 'text', order: 3, required: true },
      { id: 'b4', label: 'सेवा का विवरण (Service Request Type)', type: 'text', order: 4, required: true, defaultValue: 'नया कनेक्शन' },
      { id: 'b5', label: 'आवेदक का नाम (Applicant Name)', type: 'text', order: 5, required: true },
      { id: 'b6', label: 'पूरा पता (Full Address)', type: 'longtext', order: 6, required: true },
      { id: 'b7', label: 'आवेदन तिथि (Application Date)', type: 'date', order: 7, required: true },
      { id: 'b8', label: 'फोन नंबर (Phone)', type: 'number', order: 8, required: true },
      { id: 'b9', label: 'ईमेल (Email)', type: 'text', order: 9, required: false },
      { id: 'b10', label: 'आवेदन शुल्क (Application Fee)', type: 'currency', order: 10, required: true, defaultValue: '500' },
      { id: 'b11', label: 'दस्तावेज़ संलग्न हैं? (Docs Attached?)', type: 'checkbox', order: 11, required: true },
    ],
  }
];

export function getSavedTemplates(): Template[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (!raw) {
      // Seed with sample templates on first load
      const seed = [...SAMPLE_TEMPLATES];
      saveAllTemplates(seed);
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [...SAMPLE_TEMPLATES];
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse saved templates:', e);
    return [...SAMPLE_TEMPLATES]; // return a copy so callers can't mutate the constant
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
      console.warn('Storage quota exceeded. Pruning history to recover space.');
      try {
        const history = getFilledHistory().slice(0, 10);
        localStorage.setItem(STORAGE_KEYS.FILLED_HISTORY, JSON.stringify(history));
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        console.error('Failed to recover storage quota:', retryErr);
        return false;
      }
    }
    console.error(`Failed to write to localStorage for key ${key}:`, e);
    return false;
  }
}

export function saveAllTemplates(templates: Template[]): void {
  safeSetItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
}

export function saveTemplate(template: Template): Template[] {
  const all = getSavedTemplates();
  const existingIndex = all.findIndex(t => t.id === template.id);

  const updatedTemplate = { ...template, updatedAt: Date.now() };

  if (existingIndex >= 0) {
    all[existingIndex] = updatedTemplate;
  } else {
    all.unshift(updatedTemplate);
  }

  saveAllTemplates(all);
  return all;
}

export function deleteTemplate(id: string): Template[] {
  const all = getSavedTemplates().filter(t => t.id !== id);
  saveAllTemplates(all);
  return all;
}

export function getFilledHistory(): FilledInstance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FILLED_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFilledInstance(instance: FilledInstance): FilledInstance[] {
  try {
    const history = getFilledHistory();
    const updated = [instance, ...history.filter(h => h.id !== instance.id)].slice(0, 50); // Keep last 50
    safeSetItem(STORAGE_KEYS.FILLED_HISTORY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save fill history:', e);
    return [];
  }
}

export function saveMultipleFilledInstances(instances: FilledInstance[]): FilledInstance[] {
  try {
    const history = getFilledHistory();
    const newIds = new Set(instances.map(i => i.id));
    const updated = [...instances, ...history.filter(h => !newIds.has(h.id))].slice(0, 100);
    safeSetItem(STORAGE_KEYS.FILLED_HISTORY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save batch fill history:', e);
    return [];
  }
}


export function exportTemplatesJSON(templates: Template[]): string {
  return JSON.stringify(templates, null, 2);
}

export function parseTemplatesJSON(jsonString: string): Template[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON — file could not be parsed.');
  }

  const validate = (item: unknown): item is Template => {
    if (!item || typeof item !== 'object') return false;
    const t = item as Record<string, unknown>;
    return (
      typeof t.id === 'string' &&
      typeof t.bodyText === 'string' &&
      Array.isArray(t.blanks)
    );
  };

  if (Array.isArray(parsed)) {
    const valid = parsed.filter(validate);
    if (valid.length === 0) throw new Error('No valid templates found in the imported file.');
    return valid;
  } else if (validate(parsed)) {
    return [parsed];
  }
  throw new Error('Invalid Fillify template JSON format.');
}
