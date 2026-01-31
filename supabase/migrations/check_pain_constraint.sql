SELECT pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'sport.pain_reports'::regclass AND conname = 'pain_reports_pain_type_check';
