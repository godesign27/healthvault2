/*
  # Seed Segmentation 2.0 project with segmentations

  1. Inserts
    - Add segmentations for the "Segmentation 2.0" project
    - Italy - Primary Care
    - USA - Primary Care
    - Germany - Primary Care
    - Nordics - Neuro (has scenario)
    - Germany - Cardiovascular
    - Italy - Cardiovascular

  2. Notes
    - Uses the existing Segmentation 2.0 project ID
    - Sets up the base segmentations that will be displayed
*/

-- Insert segmentations for Segmentation 2.0 project
INSERT INTO segmentations (project_id, name, business_unit, docs, users, has_scenario)
SELECT 
  id,
  unnest(ARRAY['Italy', 'USA', 'Germany', 'Nordics', 'Germany', 'Italy']),
  unnest(ARRAY['Primary Care', 'Primary Care', 'Primary Care', 'Neuro', 'Cardiovascular', 'Cardiovascular']),
  unnest(ARRAY[3, 1, 2, 1, 6, 2]),
  7,
  unnest(ARRAY[false, false, false, true, false, false])
FROM projects 
WHERE name = 'Segmentation 2.0'
ON CONFLICT DO NOTHING;
