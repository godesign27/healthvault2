import { supabase } from '../supabase';

interface ImportData {
  conditions: { unique: any[] };
  medications: { unique: any[] };
  allergies: { unique: any[] };
  immunizations: { unique: any[] };
  providerName?: string; // optional — passed from the connection flow
}

export async function importMedicalRecords(data: ImportData) {
  console.log('importMedicalRecords called with data:', {
    conditions: data.conditions.unique.length,
    medications: data.medications.unique.length,
    allergies: data.allergies.unique.length,
    immunizations: data.immunizations.unique.length
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('User not authenticated');
    throw new Error('User not authenticated');
  }

  console.log('User authenticated:', user.id);

  const userId = user.id;

  const results = {
    conditions: 0,
    medications: 0,
    allergies: 0,
    immunizations: 0,
    errors: [] as string[],
  };

  if (data.conditions.unique.length > 0) {
    const conditionsToInsert = data.conditions.unique.map(item => ({
      user_id: userId,
      name: item.name,
      diagnosed_on: item.diagnosedOn || null,
      status: item.status || 'Active',
      managing_physician: item.managingPhysician || null,
      notes: item.notes || null,
    }));

    console.log('Inserting conditions:', conditionsToInsert);

    const { data: inserted, error } = await supabase
      .from('conditions')
      .insert(conditionsToInsert)
      .select();

    if (error) {
      console.error('Error inserting conditions:', error);
      results.errors.push(`Conditions: ${error.message}`);
    } else {
      console.log('Successfully inserted conditions:', inserted?.length);
      results.conditions = inserted?.length || 0;
    }
  }

  if (data.medications.unique.length > 0) {
    const medicationsToInsert = data.medications.unique.map(item => ({
      user_id: userId,
      name: item.name,
      dosage: item.dosage || null,
      frequency: item.frequency || null,
      prescribed_by: item.prescribedBy || null,
      start_date: item.startDate || null,
      end_date: item.endDate || null,
      notes: item.notes || null,
    }));

    console.log('Inserting medications:', medicationsToInsert);

    const { data: inserted, error } = await supabase
      .from('medications')
      .insert(medicationsToInsert)
      .select();

    if (error) {
      console.error('Error inserting medications:', error);
      results.errors.push(`Medications: ${error.message}`);
    } else {
      console.log('Successfully inserted medications:', inserted?.length);
      results.medications = inserted?.length || 0;
    }
  }

  if (data.allergies.unique.length > 0) {
    const allergiesToInsert = data.allergies.unique.map(item => ({
      user_id: userId,
      allergen: item.allergen,
      reaction: item.reaction || null,
      severity: item.severity || null,
      diagnosed_on: item.diagnosedOn || null,
      notes: item.notes || null,
    }));

    console.log('Inserting allergies:', allergiesToInsert);

    const { data: inserted, error } = await supabase
      .from('allergies')
      .insert(allergiesToInsert)
      .select();

    if (error) {
      console.error('Error inserting allergies:', error);
      results.errors.push(`Allergies: ${error.message}`);
    } else {
      console.log('Successfully inserted allergies:', inserted?.length);
      results.allergies = inserted?.length || 0;
    }
  }

  if (data.immunizations.unique.length > 0) {
    const immunizationsToInsert = data.immunizations.unique.map(item => ({
      user_id: userId,
      vaccine: item.vaccine,
      administered_on: item.administeredOn || null,
      provider: item.provider || null,
      lot_number: item.lotNumber || null,
      next_dose: item.nextDose || null,
      notes: item.notes || null,
    }));

    console.log('Inserting immunizations:', immunizationsToInsert);

    const { data: inserted, error } = await supabase
      .from('immunizations')
      .insert(immunizationsToInsert)
      .select();

    if (error) {
      console.error('Error inserting immunizations:', error);
      results.errors.push(`Immunizations: ${error.message}`);
    } else {
      console.log('Successfully inserted immunizations:', inserted?.length);
      results.immunizations = inserted?.length || 0;
    }
  }

  console.log('Import results:', results);

  // Create a health_records document entry so the import is visible on the Records page
  const totalImported = results.conditions + results.medications + results.allergies + results.immunizations;
  if (totalImported > 0) {
    const parts: string[] = [];
    if (results.conditions > 0) parts.push(`${results.conditions} condition${results.conditions !== 1 ? 's' : ''}`);
    if (results.medications > 0) parts.push(`${results.medications} medication${results.medications !== 1 ? 's' : ''}`);
    if (results.allergies > 0) parts.push(`${results.allergies} allerg${results.allergies !== 1 ? 'ies' : 'y'}`);
    if (results.immunizations > 0) parts.push(`${results.immunizations} immunization${results.immunizations !== 1 ? 's' : ''}`);

    const providerLabel = data.providerName ? `from ${data.providerName}` : 'via provider connection';
    const summary = `Imported ${parts.join(', ')} ${providerLabel}.`;

    await supabase.from('health_records').insert({
      user_id: userId,
      kind: 'specialist_report',
      title: `Medical Record Import${data.providerName ? ` — ${data.providerName}` : ''}`,
      provider_name: data.providerName || 'Connected Provider',
      service_date: new Date().toISOString().split('T')[0],
      source: 'connected',
      ai_summary: summary,
      tags: ['import', 'medical-profile'],
    }).then(() => {}).catch(err => console.warn('Could not create health_records entry for import:', err));
  }

  return results;
}
