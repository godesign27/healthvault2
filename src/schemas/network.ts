import { z } from 'zod';

export const ProviderRelationshipZ = z.enum(['Primary', 'Specialist', 'Dental', 'Vision', 'Therapy', 'Other']);
export const ProviderConnectionSourceZ = z.enum(['FHIR', 'Manual', 'Referral']);
export const DeliveryOptionZ = z.enum(['Pickup', 'Delivery', 'Mail']);

export const AddProviderInputZ = z.object({
  npi: z.string().optional(),
  name: z.string().min(1, 'Provider name is required').trim(),
  specialty: z.string().optional().transform(val => val?.trim()),
  clinic: z.string().optional().transform(val => val?.trim()),
  phone: z.string().optional().transform(val => val?.trim().replace(/[^\d]/g, '')),
  email: z.string().email('Invalid email').optional().or(z.literal('')).transform(val => val?.trim()),
  address: z.string().optional().transform(val => val?.trim()),
  relationship: ProviderRelationshipZ.optional(),
  connectionSource: ProviderConnectionSourceZ.default('Manual'),
  lastVisitDate: z.string().datetime().optional(),
  inNetwork: z.boolean().optional(),
  notes: z.string().optional().transform(val => val?.trim()),
});

export const UpdateProviderInputZ = AddProviderInputZ.extend({
  id: z.string().uuid(),
});

export const AddPharmacyInputZ = z.object({
  name: z.string().min(1, 'Pharmacy name is required').trim(),
  chain: z.string().optional().transform(val => val?.trim()),
  phone: z.string().optional().transform(val => val?.trim().replace(/[^\d]/g, '')),
  address: z.string().optional().transform(val => val?.trim()),
  preferred: z.boolean().default(false),
  deliveryOptions: z.array(DeliveryOptionZ).optional(),
  inNetwork: z.boolean().optional(),
  notes: z.string().optional().transform(val => val?.trim()),
});

export const UpdatePharmacyInputZ = AddPharmacyInputZ.extend({
  id: z.string().uuid(),
});

export type AddProviderInput = z.infer<typeof AddProviderInputZ>;
export type UpdateProviderInput = z.infer<typeof UpdateProviderInputZ>;
export type AddPharmacyInput = z.infer<typeof AddPharmacyInputZ>;
export type UpdatePharmacyInput = z.infer<typeof UpdatePharmacyInputZ>;
