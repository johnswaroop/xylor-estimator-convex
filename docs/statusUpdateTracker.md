# Status Update Tracker

## Flow Diagram

```mermaid
flowchart TD
    A["CREATE_LEAD"] --> B["BUILD_TEAM"]
    B --> C["ATTATCH_QUALIFIER"]
    C --> D["SEND_QUALIFIER"]
    D --> E["AWAIT_RESPONSE"]
    E --> F["QUALIFIER_RECEIVED"]
    F --> G["QUALIFIER_IN_REVIEW"]
    G --> H["QUALIFIER_APPROVED"]
    G --> I["QUALIFIER_REJECTED"]
    H --> J["SENT_FOR_ESTIMATE"]
    J --> K["ESTIMATE_RECEIVED"]
    K --> L["ESTIMATE_IN_REVIEW"]
    L --> M["ESTIMATE_APPROVED"]
    L --> N["ESTIMATE_REJECTED"]
    M --> O["SEND_ESTIMATE"]
    O --> P["AWAIT_ESTIMATE_RESPONSE"]
    P --> Q["ESTIMATE_RESPONSE_RECEIVED"]
    Q --> R["ESTIMATE_RESPONSE_IN_REVIEW"]
    R --> S["ESTIMATE_RESPONSE_APPROVED"]
    R --> T["ESTIMATE_RESPONSE_REJECTED"]

    %% Color coding
    classDef implemented fill:#22c55e,stroke:#16a34a,color:#fff
    classDef missing fill:#ef4444,stroke:#dc2626,color:#fff
    classDef critical fill:#f59e0b,stroke:#d97706,color:#fff

    %% Apply styles
    class A,B,C,D,E implemented
    class F critical
    class G,H,I,J,K,L,M,N,O,P,Q,R,S,T missing
```

## Status Implementation

| Status                        | File                | Function             | Status         |
| ----------------------------- | ------------------- | -------------------- | -------------- |
| `CREATE_LEAD`                 | `lead_service.ts`   | `createNewLead`      | ✅             |
| `BUILD_TEAM`                  | `lead_service.ts`   | `createNewLead`      | ✅             |
| `ATTATCH_QUALIFIER`           | `form_service.ts`   | `attachFormToLead`   | ✅             |
| `SEND_QUALIFIER`              | `SendQualifier.tsx` | `useEffect`          | ✅             |
| `AWAIT_RESPONSE`              | `SendQualifier.tsx` | `handleSendEmail`    | ✅             |
| `QUALIFIER_RECEIVED`          | `form_service.ts`   | `recordFormResponse` | 🔴 **MISSING** |
| `QUALIFIER_IN_REVIEW`         | -                   | -                    | ❌             |
| `QUALIFIER_APPROVED`          | -                   | -                    | ❌             |
| `QUALIFIER_REJECTED`          | -                   | -                    | ❌             |
| `SENT_FOR_ESTIMATE`           | -                   | -                    | ❌             |
| `ESTIMATE_RECEIVED`           | -                   | -                    | ❌             |
| `ESTIMATE_IN_REVIEW`          | -                   | -                    | ❌             |
| `ESTIMATE_APPROVED`           | -                   | -                    | ❌             |
| `ESTIMATE_REJECTED`           | -                   | -                    | ❌             |
| `SEND_ESTIMATE`               | -                   | -                    | ❌             |
| `AWAIT_ESTIMATE_RESPONSE`     | -                   | -                    | ❌             |
| `ESTIMATE_RESPONSE_RECEIVED`  | -                   | -                    | ❌             |
| `ESTIMATE_RESPONSE_IN_REVIEW` | -                   | -                    | ❌             |
| `ESTIMATE_RESPONSE_APPROVED`  | -                   | -                    | ❌             |
| `ESTIMATE_RESPONSE_REJECTED`  | -                   | -                    | ❌             |

## Critical Fix Required

**File**: `convex/form_service.ts`  
**Function**: `recordFormResponse`  
**Missing**: `QUALIFIER_RECEIVED` status creation

```typescript
// Current code (line 237-240)
const updatedForm = await ctx.db.patch(args.form_id, {
  response: args.response,
  response_received: true,
});

// Should add:
await ctx.db.insert("status", {
  name: "QUALIFIER_RECEIVED",
  lead_id: form.lead_id,
  status: "QUALIFIER_RECEIVED",
});
```

## Implementation Count

- **Implemented**: 5/20 (25%)
- **Missing**: 15/20 (75%)
- **Critical Bug**: 1 (breaks workflow)
