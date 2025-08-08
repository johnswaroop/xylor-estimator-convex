# Xylor Estimator Application - Complete User Flow

## Overview

This document maps the complete user journey through the Xylor Estimator application, from initial signup to lead completion, including all decision points, status transitions, and checkbox-based workflow controls.

## User Roles

- **ADMIN**: Company administrators who can manage leads, assign teams, and control workflows
- **USER**: Company members who can view data but have limited editing permissions
- **BD (Business Development)**: Handle initial lead contact and qualification
- **ESTIMATOR**: Technical assessment and cost estimation
- **SUPERVISOR**: Quality control and approval
- **CLIENT**: External users who fill out qualification forms

---

## Complete User Flow

### 1. Authentication & Company Setup

```mermaid
flowchart TD
    A["New User Visits Site"] --> B{"Authenticated?"}
    B -->|No| C["Redirected to /auth/signin"]
    C --> D{"Has Account?"}
    D -->|No| E["Click Sign Up Link"]
    D -->|Yes| F["Enter Credentials"]

    E --> G["Fill Sign Up Form"]
    G --> H["Name, Email, Password"]
    H --> I["Submit with flow: signUp"]
    I --> J["Account Created via Convex Auth"]

    F --> K["Submit with flow: signIn"]
    K --> L{"Valid Credentials?"}
    L -->|No| M["Show Error Message"]
    L -->|Yes| N["Authenticated Successfully"]

    J --> N
    M --> C
    N --> O["Redirect to /dashboard"]

    O --> P{"User Has Companies?"}
    P -->|No| Q["Redirect to /team page"]
    P -->|Yes| R["Auto-select First Company"]

    Q --> S["Create New Company"]
    S --> T["Fill Company Details: Name, Email, Logo"]
    T --> U["Submit createCompany Mutation"]
    U --> V["User Becomes ADMIN of Company"]
    V --> W["Redirect to Dashboard"]

    R --> W["Dashboard with Company Selected"]
```

### 2. Dashboard & Lead Management

```mermaid
flowchart TD
    A["Dashboard Loaded"] --> B["Display Company Leads in Table"]
    B --> C["Company ID from Query State"]
    C --> D["Sidebar Shows Company Info & Navigation"]

    D --> E{"User Action"}
    E -->|"Click New Lead"| F["Navigate to /bd/actions/company_id/new-lead"]
    E -->|"Click Lead Row"| G["Navigate to Lead Detail View"]
    E -->|"Company Selector"| H["Switch Company Context"]

    H --> I["Update companyId Query State"]
    I --> J["Refresh Dashboard Data"]
    J --> B
```

### 3. Lead Creation Flow

```mermaid
flowchart TD
    A["New Lead Form Page"] --> B["Fill Lead Information"]
    B --> C["Name, Email, Phone"]
    C --> D["Optional: Select Lead Source"]

    D --> E{"Build Team Checkbox"}
    E -->|"Checked"| F["buildTeam = true"]
    E -->|"Unchecked"| G["buildTeam = false"]

    F --> H["Submit Form with build_team: true"]
    G --> I["Submit Form with build_team: false"]

    H --> J["createNewLead Mutation"]
    I --> J

    J --> K["Insert Lead Record"]
    K --> L["Create Status: CREATE_LEAD"]

    L --> M{"build_team Parameter?"}
    M -->|true| N["Create Status: BUILD_TEAM"]
    M -->|false| O["Lead Created - Stay at CREATE_LEAD"]

    N --> P["Redirect to /bd/actions/company_id/build-team/lead_id"]
    O --> Q["Redirect to Dashboard"]
```

### 4. Team Building Flow

```mermaid
flowchart TD
    A["Team Builder Page"] --> B["Load Lead Details"]
    B --> C["Display Current Team Members"]
    C --> D["Display Available Company Members"]

    D --> E{"User Actions"}
    E -->|"Assign Member"| F["Select Member & Role"]
    F --> G["BD, ESTIMATOR, or SUPERVISOR"]
    G --> H["createTeamAssignment Mutation"]
    H --> I["Add to Current Team Display"]

    E -->|"Remove Member"| J["Mark Assignment as Invalid"]
    J --> K["Update Team Display"]

    I --> L{"Continue Decision"}
    K --> L
    L --> M["Attach Qualifier Checkbox"]

    M -->|"Checked"| N["attachQualifier = true"]
    M -->|"Unchecked"| O["attachQualifier = false"]

    N --> P["Click Save & Continue"]
    O --> P

    P --> Q["updateStatusToAttachQualifier"]
    Q --> R{"attachQualifier?"}
    R -->|true| S["Create Status: ATTATCH_QUALIFIER"]
    R -->|false| T["Stay at BUILD_TEAM Status"]

    S --> U["Navigate to /bd/actions/company_id/attach-qualifier/lead_id"]
    T --> V["Navigate to Dashboard"]
```

### 5. Qualifier Attachment Flow

```mermaid
flowchart TD
    A["Attach Qualifier Page"] --> B["Load Existing Form if Present"]
    B --> C["Display Form Selection Options"]

    C --> D["Select Qualification Form Type"]
    D --> E["Lock Qualifier Checkbox"]

    E -->|"Checked"| F["lockQualifier = true"]
    E -->|"Unchecked"| G["lockQualifier = false"]

    F --> H["Click Save & Continue"]
    G --> H

    H --> I["attachFormToLead Mutation"]
    I --> J{"Form Exists?"}
    J -->|Yes| K["Update Existing Form"]
    J -->|No| L["Create New qualification_form Record"]

    K --> M{"lockQualifier?"}
    L --> M

    M -->|true| N["Create Status: SEND_QUALIFIER"]
    M -->|false| O["Stay at ATTATCH_QUALIFIER"]

    N --> P["Navigate to /bd/actions/company_id/send-qualifier/lead_id"]
    O --> Q["Navigate to Dashboard"]
```

### 6. Qualifier Sending Flow

```mermaid
flowchart TD
    A["Send Qualifier Page"] --> B["Auto-create Status: SEND_QUALIFIER"]
    B --> C["Load Lead & Company Details"]
    C --> D["Load Qualification Form"]

    D --> E["Generate Form Link"]
    E --> F["forms/form_id"]
    F --> G["Pre-populate Email Template"]

    G --> H["Subject, Body, From Email"]
    H --> I["User Reviews Email Content"]

    I --> J["Click Send Email"]
    J --> K["POST to /api/send-email"]
    K --> L["SendGrid Email Sent"]

    L --> M["updateFormWithEmailSent"]
    M --> N["Set email_sent: true"]
    N --> O["Create Status: AWAIT_RESPONSE"]

    O --> P["Email Sent Successfully"]
    P --> Q["User Can Navigate Away"]
```

### 7. Client Form Submission Flow

```mermaid
flowchart TD
    A["Client Receives Email"] --> B["Clicks Form Link"]
    B --> C["Opens /forms/form_id"]

    C --> D["Multi-Step Form Interface"]
    D --> E["Step 1: Personal Details"]
    E --> F["Step 2: Project Details"]
    F --> G["Step 3: Project Specifications"]
    G --> H["Step 4: Timeline & Budget"]
    H --> I["Step 5: Services & Files"]
    I --> J["Step 6: Review & Submit"]

    J --> K{"Form Validation"}
    K -->|Invalid| L["Show Errors - Stay on Step"]
    K -->|Valid| M["Submit Form Data"]

    L --> D
    M --> N["recordFormResponse Mutation"]
    N --> O["Update qualification_form"]
    O --> P["Set response_received: true"]
    P --> Q["Store Response Data"]

    Q --> R["Auto-create Status: QUALIFIER_RECEIVED"]
    R --> S["Success Message to Client"]
```

### 8. Internal Review Flow

```mermaid
flowchart TD
    A["Status: QUALIFIER_RECEIVED"] --> B["Team Reviews Response"]
    B --> C["Dashboard Lead View"]
    C --> D["Response Tab Shows Form Data"]

    D --> E{"Review Decision"}
    E -->|Approve| F["Manual Status Update"]
    E -->|Reject| G["Manual Status Update"]
    E -->|"Need More Info"| H["Manual Status Update"]

    F --> I["Status: QUALIFIER_APPROVED"]
    G --> J["Status: QUALIFIER_REJECTED"]
    H --> K["Status: QUALIFIER_IN_REVIEW"]

    I --> L["Continue to Estimation"]
    J --> M{"Rejection Handling"}
    K --> N["Request Additional Info"]

    M -->|"Revise Requirements"| O["Back to ATTATCH_QUALIFIER"]
    M -->|"End Process"| P["Lead Marked Invalid"]

    L --> Q["Status: SENT_FOR_ESTIMATE"]
```

### 9. Estimation Flow

```mermaid
flowchart TD
    A["Status: SENT_FOR_ESTIMATE"] --> B["Estimator Team Notified"]
    B --> C["Estimator Reviews Requirements"]

    C --> D["Prepare Cost Estimate"]
    D --> E["Status: ESTIMATE_RECEIVED"]

    E --> F{"Estimate Review"}
    F -->|Approve| G["Status: ESTIMATE_APPROVED"]
    F -->|Reject| H["Status: ESTIMATE_REJECTED"]
    F -->|"Revisions Needed"| I["Status: ESTIMATE_IN_REVIEW"]

    G --> J["Status: SEND_ESTIMATE"]
    H --> K["Back to ESTIMATE_RECEIVED"]
    I --> L["Revise Estimate"]

    J --> M["Send Estimate to Client"]
    M --> N["Status: AWAIT_ESTIMATE_RESPONSE"]

    L --> D
    K --> C
```

### 10. Final Client Response Flow

```mermaid
flowchart TD
    A["Status: AWAIT_ESTIMATE_RESPONSE"] --> B["Client Reviews Estimate"]

    B --> C{"Client Decision"}
    C -->|Accept| D["Status: ESTIMATE_RESPONSE_RECEIVED"]
    C -->|"Request Changes"| E["Status: ESTIMATE_RESPONSE_RECEIVED"]
    C -->|Reject| F["Status: ESTIMATE_RESPONSE_RECEIVED"]

    D --> G["Status: ESTIMATE_RESPONSE_IN_REVIEW"]
    E --> G
    F --> G

    G --> H{"Internal Review"}
    H -->|"Accept Project"| I["Status: PROJECT_APPROVED"]
    H -->|"Negotiate Terms"| J["Back to SEND_ESTIMATE"]
    H -->|Decline| K["Status: ESTIMATE_RESPONSE_REJECTED"]

    I --> L["Project Moves to Execution"]
    J --> M["Revise Estimate"]
    K --> N["End Lead Process"]
```

---

## Status Transition Summary

### Sequential Status Flow

1. **CREATE_LEAD** → Lead created in system
2. **BUILD_TEAM** → Team members assigned (optional)
3. **ATTATCH_QUALIFIER** → Qualification form attached
4. **SEND_QUALIFIER** → Email sent to client
5. **AWAIT_RESPONSE** → Waiting for client form submission
6. **QUALIFIER_RECEIVED** → Client submitted form (automatic)
7. **QUALIFIER_IN_REVIEW** → Internal team reviewing
8. **QUALIFIER_APPROVED/REJECTED** → Review decision
9. **SENT_FOR_ESTIMATE** → Passed to estimation team
10. **ESTIMATE_RECEIVED** → Estimate prepared
11. **ESTIMATE_IN_REVIEW** → Estimate being reviewed
12. **ESTIMATE_APPROVED/REJECTED** → Estimate decision
13. **SEND_ESTIMATE** → Estimate sent to client
14. **AWAIT_ESTIMATE_RESPONSE** → Waiting for client decision
15. **ESTIMATE_RESPONSE_RECEIVED** → Client responded
16. **ESTIMATE_RESPONSE_IN_REVIEW** → Reviewing client response
17. **ESTIMATE_RESPONSE_APPROVED/REJECTED** → Final decision

### Checkbox Control Points

#### 1. New Lead Creation

- **Checkbox**: "Build Team in the next step"
- **Checked**: Redirects to team building, creates BUILD_TEAM status
- **Unchecked**: Returns to dashboard, stays at CREATE_LEAD

#### 2. Team Building

- **Checkbox**: "Attach qualifier in the next step"
- **Checked**: Creates ATTATCH_QUALIFIER status, redirects to qualifier attachment
- **Unchecked**: Returns to dashboard, stays at BUILD_TEAM

#### 3. Qualifier Attachment

- **Checkbox**: "Lock the qualifier and continue to next step"
- **Checked**: Creates SEND_QUALIFIER status, redirects to send qualifier
- **Unchecked**: Returns to dashboard, stays at ATTATCH_QUALIFIER

---

## Key Insights

### Automatic vs Manual Transitions

- **Automatic**: Form submissions trigger status changes automatically
- **Manual**: Review processes require human intervention
- **Checkbox-Driven**: User checkboxes control workflow progression

### Branch Scenarios

- **Skipped Steps**: Unchecked checkboxes allow skipping workflow steps
- **Rejection Paths**: Rejected items can loop back to previous steps
- **Dead Ends**: Some rejection paths end the lead process

### External Dependencies

- **Email System**: SendGrid integration for client communication
- **File Storage**: S3 integration for document uploads
- **Form System**: Public form endpoints for client access

### User Experience

- **Progressive Disclosure**: Complex workflows broken into manageable steps
- **Flexible Flow**: Checkboxes allow customization of process depth
- **Status Visibility**: Clear status indicators show current progress
- **Role-Based Access**: Different user types have appropriate permissions
