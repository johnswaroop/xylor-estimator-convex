# User

id
name
email
password
enabled
created_at
updated_at

# Company

id
name
email
logo (optional)
created_at
updated_at

# Lead

id
name
email
phone
lead_note (optional)
void_note (optional)
valid (boolean - false if voided)
isInitial (boolean)
company_id
source_id
created_at
updated_at
voided_at (optional)

# team_assignment

id
lead_id
user_id (assignee)
type (BD | ESTIMATOR | ADMIN)
assigned_at
assigned_by (user_id)

# lead_source

id
name (website, referral, cold_call, trade_show, etc.)
description (optional)
active (boolean)

# qualifier_form

id
lead_id
response (JSON object with answers to qualification questions)

# Example response structure:

# {

# "funding_secured": true/false,

# "council_license_approved": true/false,

# "plan_pdf_available": true/false,

# "pdf_link": "https://..." (optional),

# "additional_notes": "text"

# }

edits ([{_v, label, value, edited_by, edited_at}])
email_sent (timestamp)
response_received (timestamp)
valid (boolean)
created_at
updated_at

# qualification_questions (reference for form structure)

1. Is project funding secured? (boolean)
2. Is council license approved? (boolean)
3. Is plan PDF available? (boolean)

# status

id
lead_id
activity ([{
id,
index,
name,
completed_at,
completed_by
}])
created_at
updated_at
