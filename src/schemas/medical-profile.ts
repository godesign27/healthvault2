import { z } from 'zod';

export const ConditionSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().optional(),
  name: z.string().min(1, 'Condition name is required'),
  diagnosedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().nullable(),
  status: z.enum(['Active', 'In remission', 'Resolved']).optional().nullable(),
  managingPhysician: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export const MedicationSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().optional(),
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  prescribedBy: z.string().optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export const AllergySchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().optional(),
  allergen: z.string().min(1, 'Allergen name is required'),
  reaction: z.string().optional().nullable(),
  severity: z.enum(['Mild', 'Moderate', 'Severe']).optional().nullable(),
  diagnosedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export const ImmunizationSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().optional(),
  vaccine: z.string().min(1, 'Vaccine name is required'),
  administeredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().nullable(),
  provider: z.string().optional().nullable(),
  lotNumber: z.string().optional().nullable(),
  nextDose: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export type Condition = z.infer<typeof ConditionSchema>;
export type Medication = z.infer<typeof MedicationSchema>;
export type Allergy = z.infer<typeof AllergySchema>;
export type Immunization = z.infer<typeof ImmunizationSchema>;
