import { useState, useEffect, MutableRefObject } from 'react';
import { Stethoscope, Pill, AlertTriangle, Syringe, CalendarCheck, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AssistantDrawer } from '../components/AssistantDrawer';
import { ToastContainer, ToastProps } from '../components/Toast';
import { MedicalIDCard } from '../components/MedicalIDCard';
import type { Condition } from '../schemas/medical-profile';

interface MedicalProfilePageProps {
  darkMode?: boolean;
  actionsRef?: MutableRefObject<{
    openAddCondition?: () => void;
    openAddMedication?: () => void;
    openAddAllergy?: () => void;
    openAddImmunization?: () => void;
  }>;
}

export function MedicalProfilePage({ darkMode = false, actionsRef }: MedicalProfilePageProps) {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [allergies, setAllergies] = useState<any[]>([]);
  const [immunizations, setImmunizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerSessionId, setDrawerSessionId] = useState('');
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        setConditions([]);
        setMedications([]);
        setAllergies([]);
        setImmunizations([]);
        setIsLoading(false);
        return;
      }
      const [conditionsRes, medicationsRes, allergiesRes, immunizationsRes] = await Promise.all([
        supabase.from('conditions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('medications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('allergies').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('immunizations').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ]);

      if (conditionsRes.error) throw conditionsRes.error;
      if (medicationsRes.error) throw medicationsRes.error;
      if (allergiesRes.error) throw allergiesRes.error;
      if (immunizationsRes.error) throw immunizationsRes.error;

      setConditions(conditionsRes.data || []);
      setMedications(medicationsRes.data || []);
      setAllergies(allergiesRes.data || []);
      setImmunizations(immunizationsRes.data || []);
    } catch (error) {
      console.error('Error fetching medical data:', error);
      showToast('error', 'Failed to load medical data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (actionsRef) {
      actionsRef.current = {
        openAddCondition: handleOpenDrawer,
        openAddMedication: () => {},
        openAddAllergy: () => {},
        openAddImmunization: () => {},
        refreshData: fetchAllData
      };
    }
  }, [actionsRef]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = crypto.randomUUID();
    const newToast: ToastProps = {
      id,
      type,
      message,
      onClose: removeToast
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleOpenDrawer = () => {
    setDrawerSessionId(crypto.randomUUID());
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleConditionComplete = async (record: Condition) => {
    handleCloseDrawer();
    showToast('success', `Successfully added "${record.name}" to your medical profile`);
    await fetchAllData();
  };

  const activeConditions = conditions.filter(c => c.status === 'Active' || !c.status);

  return (
    <>
      <div className="w-full p-6 sm:p-8 lg:p-12 pt-20 lg:pt-12">
        <div className="mb-8">
          <h1 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${
            darkMode ? 'text-white' : 'text-stone-900'
          }`}>
            <User className="w-7 h-7" />
            Medical Profile
          </h1>
          <p className={darkMode ? 'text-stone-400' : 'text-stone-600'}>
            Your medical profile gives you and your healthcare providers a complete picture of your current health. Keep your conditions, medications, allergies, and immunizations organized in one secure place — always up to date and ready to share.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-6 mb-8">
          <div className="md:col-span-4 lg:col-span-6 lg:row-span-2">
            <div className="h-full">
              <MedicalIDCard darkMode={darkMode} />
            </div>
          </div>

          <div className="md:col-span-3 lg:col-span-3 h-full">
            <div className={`h-full rounded-xl border p-6 bg-white ${
              darkMode ? 'border-stone-800' : 'border-stone-200'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <h3 className={`text-sm font-medium ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>Conditions</h3>
                <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-stone-700' : 'bg-blue-50'}`}>
                  <Stethoscope className={`w-5 h-5 ${darkMode ? 'text-stone-400' : 'text-blue-600'}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                {conditions.length}
              </p>
              <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                {activeConditions.length} active
              </p>
            </div>
          </div>

          <div className="md:col-span-3 lg:col-span-3 h-full">
            <div className={`h-full rounded-xl border p-6 bg-white ${
              darkMode ? 'border-stone-800' : 'border-stone-200'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <h3 className={`text-sm font-medium ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>Medications</h3>
                <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-stone-700' : 'bg-emerald-50'}`}>
                  <Pill className={`w-5 h-5 ${darkMode ? 'text-stone-400' : 'text-emerald-600'}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                {medications.length}
              </p>
              <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>{medications.length} active</p>
            </div>
          </div>

          <div className="md:col-span-3 lg:col-span-3 h-full">
            <div className={`h-full rounded-xl border p-6 bg-white ${
              darkMode ? 'border-stone-800' : 'border-stone-200'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <h3 className={`text-sm font-medium ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>Allergies</h3>
                <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-stone-700' : 'bg-amber-50'}`}>
                  <AlertTriangle className={`w-5 h-5 ${darkMode ? 'text-stone-400' : 'text-amber-600'}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                {allergies.length}
              </p>
              <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                {allergies.filter(a => a.severity === 'Severe').length} severe
              </p>
            </div>
          </div>

          <div className="md:col-span-3 lg:col-span-3 h-full">
            <div className={`h-full rounded-xl border p-6 bg-white ${
              darkMode ? 'border-stone-800' : 'border-stone-200'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <h3 className={`text-sm font-medium ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>Immunizations</h3>
                <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-stone-700' : 'bg-rose-50'}`}>
                  <Syringe className={`w-5 h-5 ${darkMode ? 'text-stone-400' : 'text-rose-600'}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                {immunizations.length}
              </p>
              <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>Up to date</p>
            </div>
          </div>
        </div>

        <section className="mb-10">
          <div className="mb-4">
            <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-stone-900'}`}>Current Health</h2>
            <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              A summary of your active health conditions and ongoing issues. Add, update, or attach physician notes as your health changes.
            </p>
          </div>

          {isLoading ? (
            <div className={`rounded-xl border p-8 text-center bg-white ${
              darkMode ? 'border-stone-800' : 'border-stone-200'
            }`}>
              <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                Loading conditions...
              </p>
            </div>
          ) : conditions.length === 0 ? (
            <div className={`rounded-xl border p-8 text-center bg-white ${
              darkMode ? 'border-stone-800' : 'border-stone-200'
            }`}>
              <Stethoscope className={`w-12 h-12 mx-auto mb-4 ${
                darkMode ? 'text-stone-600' : 'text-stone-400'
              }`} />
              <h3 className={`text-lg font-semibold mb-2 ${
                darkMode ? 'text-white' : 'text-stone-900'
              }`}>No conditions added</h3>
              <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                Use the AI Assistant to add known diagnoses and ongoing issues.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {conditions.map((condition) => (
                <div
                  key={condition.id}
                  className={`rounded-xl border p-6 bg-white ${
                    darkMode ? 'border-stone-800' : 'border-stone-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-stone-700' : 'bg-blue-50'}`}>
                        <Stethoscope className={`w-5 h-5 ${darkMode ? 'text-stone-400' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${
                          darkMode ? 'text-white' : 'text-stone-900'
                        }`}>{condition.name}</h3>
                        {condition.status && (
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                            condition.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : condition.status === 'In remission'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-stone-100 text-stone-700'
                          }`}>
                            {condition.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {(condition.diagnosedOn || condition.managingPhysician) && (
                    <div className={`mt-4 space-y-2 text-sm ${
                      darkMode ? 'text-stone-400' : 'text-stone-600'
                    }`}>
                      {condition.diagnosedOn && (
                        <p>
                          <span className="font-medium">Diagnosed:</span> {new Date(condition.diagnosedOn).toLocaleDateString()}
                        </p>
                      )}
                      {condition.managingPhysician && (
                        <p>
                          <span className="font-medium">Managing Physician:</span> {condition.managingPhysician}
                        </p>
                      )}
                    </div>
                  )}

                  {condition.notes && (
                    <p className={`mt-3 text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                      {condition.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-10">
          <div className="mb-4">
            <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-stone-900'}`}>Medications</h2>
            <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              Track your prescriptions and supplements in one place. Stay on top of refills, dosages, and physician instructions.
            </p>
          </div>
          {medications.length === 0 ? (
            <div className={`rounded-xl border p-8 text-center bg-white ${
              darkMode ? 'border-stone-800' : 'border-stone-200'
            }`}>
              <Pill className={`w-12 h-12 mx-auto mb-4 ${
                darkMode ? 'text-stone-600' : 'text-stone-400'
              }`} />
              <h3 className={`text-lg font-semibold mb-2 ${
                darkMode ? 'text-white' : 'text-stone-900'
              }`}>No medications tracked</h3>
              <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                Use the AI Assistant to add prescriptions and supplements.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {medications.map((med) => (
                <div
                  key={med.id}
                  className={`rounded-xl border p-6 bg-white ${
                    darkMode ? 'border-stone-800' : 'border-stone-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-stone-700' : 'bg-emerald-50'}`}>
                        <Pill className={`w-5 h-5 ${darkMode ? 'text-stone-400' : 'text-emerald-600'}`} />
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${
                          darkMode ? 'text-white' : 'text-stone-900'
                        }`}>{med.name}</h3>
                        {med.dosage && (
                          <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                            {med.dosage}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {(med.frequency || med.prescribed_by || med.start_date) && (
                    <div className={`mt-4 space-y-2 text-sm ${
                      darkMode ? 'text-stone-400' : 'text-stone-600'
                    }`}>
                      {med.frequency && (
                        <p>
                          <span className="font-medium">Frequency:</span> {med.frequency}
                        </p>
                      )}
                      {med.prescribed_by && (
                        <p>
                          <span className="font-medium">Prescribed By:</span> {med.prescribed_by}
                        </p>
                      )}
                      {med.start_date && (
                        <p>
                          <span className="font-medium">Started:</span> {new Date(med.start_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {med.notes && (
                    <p className={`mt-3 text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                      {med.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-10">
          <div className="mb-4">
            <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-stone-900'}`}>Allergies</h2>
            <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              List any allergies and their reactions to help avoid unwanted exposure and ensure safe treatment plans.
            </p>
          </div>
          {allergies.length === 0 ? (
            <div className={`rounded-xl border p-8 text-center bg-white ${
              darkMode ? 'border-stone-800' : 'border-stone-200'
            }`}>
              <AlertTriangle className={`w-12 h-12 mx-auto mb-4 ${
                darkMode ? 'text-stone-600' : 'text-stone-400'
              }`} />
              <h3 className={`text-lg font-semibold mb-2 ${
                darkMode ? 'text-white' : 'text-stone-900'
              }`}>No allergies listed</h3>
              <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                Use the AI Assistant to record allergens and reactions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allergies.map((allergy) => (
                <div
                  key={allergy.id}
                  className={`rounded-xl border p-6 bg-white ${
                    darkMode ? 'border-stone-800' : 'border-stone-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-stone-700' : 'bg-amber-50'}`}>
                        <AlertTriangle className={`w-5 h-5 ${darkMode ? 'text-stone-400' : 'text-amber-600'}`} />
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${
                          darkMode ? 'text-white' : 'text-stone-900'
                        }`}>{allergy.allergen}</h3>
                        {allergy.severity && (
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                            allergy.severity === 'Severe'
                              ? 'bg-red-100 text-red-700'
                              : allergy.severity === 'Moderate'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {allergy.severity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {(allergy.reaction || allergy.diagnosed_on) && (
                    <div className={`mt-4 space-y-2 text-sm ${
                      darkMode ? 'text-stone-400' : 'text-stone-600'
                    }`}>
                      {allergy.reaction && (
                        <p>
                          <span className="font-medium">Reaction:</span> {allergy.reaction}
                        </p>
                      )}
                      {allergy.diagnosed_on && (
                        <p>
                          <span className="font-medium">Diagnosed:</span> {new Date(allergy.diagnosed_on).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {allergy.notes && (
                    <p className={`mt-3 text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                      {allergy.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-10">
          <div className="mb-4">
            <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-stone-900'}`}>Immunizations</h2>
            <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              Record your vaccines and boosters for quick verification and reminders when something's due.
            </p>
          </div>
          {immunizations.length === 0 ? (
            <div className={`rounded-xl border p-8 text-center bg-white ${
              darkMode ? 'border-stone-800' : 'border-stone-200'
            }`}>
              <Syringe className={`w-12 h-12 mx-auto mb-4 ${
                darkMode ? 'text-stone-600' : 'text-stone-400'
              }`} />
              <h3 className={`text-lg font-semibold mb-2 ${
                darkMode ? 'text-white' : 'text-stone-900'
              }`}>No immunizations recorded</h3>
              <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                Use the AI Assistant to log vaccines and boosters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {immunizations.map((immunization) => (
                <div
                  key={immunization.id}
                  className={`rounded-xl border p-6 bg-white ${
                    darkMode ? 'border-stone-800' : 'border-stone-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-stone-700' : 'bg-rose-50'}`}>
                        <Syringe className={`w-5 h-5 ${darkMode ? 'text-stone-400' : 'text-rose-600'}`} />
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${
                          darkMode ? 'text-white' : 'text-stone-900'
                        }`}>{immunization.vaccine}</h3>
                      </div>
                    </div>
                  </div>

                  {(immunization.administered_on || immunization.provider || immunization.lot_number) && (
                    <div className={`mt-4 space-y-2 text-sm ${
                      darkMode ? 'text-stone-400' : 'text-stone-600'
                    }`}>
                      {immunization.administered_on && (
                        <p>
                          <span className="font-medium">Administered:</span> {new Date(immunization.administered_on).toLocaleDateString()}
                        </p>
                      )}
                      {immunization.provider && (
                        <p>
                          <span className="font-medium">Provider:</span> {immunization.provider}
                        </p>
                      )}
                      {immunization.lot_number && (
                        <p>
                          <span className="font-medium">Lot Number:</span> {immunization.lot_number}
                        </p>
                      )}
                      {immunization.next_dose && (
                        <p>
                          <span className="font-medium">Next Dose:</span> {new Date(immunization.next_dose).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {immunization.notes && (
                    <p className={`mt-3 text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                      {immunization.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-10">
          <div className="mb-4">
            <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-stone-900'}`}>Preventive Care</h2>
            <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              Stay proactive with your health. Add screenings, checkups, or care reminders recommended by your provider or the Health Vault assistant.
            </p>
          </div>
          <div className={`rounded-xl border p-8 text-center ${
            darkMode ? 'border-stone-800' : 'border-stone-200'
          }`}>
            <CalendarCheck className={`w-12 h-12 mx-auto mb-4 ${
              darkMode ? 'text-stone-600' : 'text-stone-400'
            }`} />
            <h3 className={`text-lg font-semibold mb-2 ${
              darkMode ? 'text-white' : 'text-stone-900'
            }`}>No preventive care items</h3>
            <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              Use the AI Assistant to add screenings and checkups.
            </p>
          </div>
        </section>
      </div>

      <AssistantDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        sessionId={drawerSessionId}
        taskId="add-condition"
        onComplete={handleConditionComplete}
        darkMode={darkMode}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
