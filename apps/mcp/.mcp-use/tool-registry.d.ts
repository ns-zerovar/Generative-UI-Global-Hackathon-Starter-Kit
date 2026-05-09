// Auto-generated tool registry types - DO NOT EDIT MANUALLY
// This file is regenerated whenever tools are added, removed, or updated during development
// Generated at: 2026-05-09T22:56:56.811Z

declare module "mcp-use/react" {
  interface ToolRegistry {
    "post-vet-note-comment": {
      input: { "leadId": string; "subject": string; "body": string };
      output: Record<string, unknown>;
    };
    "show-pet-health-dashboard": {
      input: { "leads"?: Array<{ "id": string; "name": string; "email"?: string | undefined; "company"?: string | undefined; "role"?: string | undefined; "workshop"?: string | undefined; "technical_level"?: string | undefined; "tools"?: Array<string> | undefined; "status"?: string | undefined; "opt_in"?: boolean | undefined; "message"?: string | undefined }> | undefined };
      output: Record<string, unknown>;
    };
    "show-pet-profile-list": {
      input: { "leads"?: Array<{ "id": string; "name": string; "email"?: string | undefined; "company"?: string | undefined; "role"?: string | undefined; "workshop"?: string | undefined; "technical_level"?: string | undefined; "tools"?: Array<string> | undefined; "status"?: string | undefined; "opt_in"?: boolean | undefined; "message"?: string | undefined }> | undefined; "segments"?: Array<{ "id": string; "name": string; "color"?: "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet" | "slate" | undefined; "leadIds"?: Array<string> | undefined }> | undefined };
      output: Record<string, unknown>;
    };
    "show-pet-status-board": {
      input: { "leads"?: Array<{ "id": string; "name": string; "email"?: string | undefined; "company"?: string | undefined; "role"?: string | undefined; "workshop"?: string | undefined; "technical_level"?: string | undefined; "tools"?: Array<string> | undefined; "status"?: string | undefined; "opt_in"?: boolean | undefined; "message"?: string | undefined }> | undefined; "segments"?: Array<{ "id": string; "name": string; "color"?: "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet" | "slate" | undefined; "leadIds"?: Array<string> | undefined }> | undefined };
      output: Record<string, unknown>;
    };
    "show-vaccination-summary": {
      input: { "leads"?: Array<{ "id": string; "name": string; "email"?: string | undefined; "company"?: string | undefined; "role"?: string | undefined; "workshop"?: string | undefined; "technical_level"?: string | undefined; "tools"?: Array<string> | undefined; "status"?: string | undefined; "opt_in"?: boolean | undefined; "message"?: string | undefined }> | undefined };
      output: Record<string, unknown>;
    };
    "show-vet-note-draft": {
      input: { "leadId"?: string | undefined; "leadName"?: string | undefined; "leadEmail"?: string | undefined; "leadCompany"?: string | undefined; "leadRole"?: string | undefined; "subject"?: string | undefined; "body"?: string | undefined };
      output: Record<string, unknown>;
    };
  }
}

export {};
