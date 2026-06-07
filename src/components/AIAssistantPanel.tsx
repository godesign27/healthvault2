import { Send, Sparkles, FileText, Building2, Calendar, Pill, Loader2, Stethoscope, AlertTriangle, Link as LinkIcon, Users, ShieldCheck, Search, X, ArrowLeft, Upload, FlaskConical, MessageCircle, ClipboardCheck, SendHorizontal } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { ProviderRecordConnectionFlow } from './records/ProviderRecordConnectionFlow';
import { InlineRecordRequestForm } from './records/InlineRecordRequestForm';
import { InsuranceProvider, Coverage } from '../schemas/insurance';
import { ConnectMethodTabs } from './insurance/ConnectMethodTabs';
import { supabase } from '../lib/supabase';
import { getVoiceMessageForContext, type PageContext } from '../lib/voice/context-messages';
import { fetchUserProfileData, updateUserProfile, type UserProfileData } from '../lib/services/profile-data';
import { sendChatMessage } from '../lib/openai/client';
import { buildPageContext } from '../lib/openai/context';
import type { ConversationMessage } from '../lib/openai/types';
import { FORM_TEMPLATES } from '../lib/forms/catalog';
import { buildAutofillAnswers, loadFormAutofillContext, mergeFormAnswers } from '../lib/forms/autopopulate';
import { getPatientProfileId, isResponseComplete, loadFormResponses, saveFormResponse } from '../lib/forms/responses';

interface Message {
  type: 'user' | 'assistant';
  message: string;
}

interface AIAssistantPanelProps {
  darkMode?: boolean;
  currentPage?: string;
  onAddCondition?: () => void;
  onAddMedication?: () => void;
  onAddAllergy?: () => void;
  onAddImmunization?: () => void;
  onAddCoverage?: () => void;
  onAddProvider?: () => void;
  onAddPharmacy?: () => void;
  onFindSpecialist?: () => void;
  onImportComplete?: (data: any) => void;
  onRefreshData?: () => Promise<void>;
  onRequestRecords?: () => void;
  startProviderConnection?: boolean;
  onProviderConnectionStarted?: () => void;
}

export function AIAssistantPanel({
  darkMode = false,
  currentPage = 'dashboard',
  onAddCondition,
  onAddMedication,
  onAddAllergy,
  onAddImmunization,
  onAddCoverage,
  onAddProvider,
  onAddPharmacy,
  onFindSpecialist,
  onImportComplete,
  onRefreshData,
  onRequestRecords,
  startProviderConnection: startProviderConnectionProp,
  onProviderConnectionStarted,
}: AIAssistantPanelProps) {
  const getInitialMessage = () => {
    return getVoiceMessageForContext((currentPage || 'dashboard') as PageContext);
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'assistant',
      message: getInitialMessage()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showProviderConnectionFlow, setShowProviderConnectionFlow] = useState(false);
  const [hasShownImportPrompt, setHasShownImportPrompt] = useState(false);
  const [awaitingImportResponse, setAwaitingImportResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Insurance flow state
  const [showInsuranceFlow, setShowInsuranceFlow] = useState(false);
  const [insuranceStep, setInsuranceStep] = useState<'picker' | 'form' | 'confirmation'>('picker');
  const [selectedProvider, setSelectedProvider] = useState<InsuranceProvider | null>(null);
  const [providers, setProviders] = useState<InsuranceProvider[]>([]);
  const [providerSearchQuery, setProviderSearchQuery] = useState('');
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [submittedCoverage, setSubmittedCoverage] = useState<Partial<Coverage> | null>(null);
  const [savingCoverage, setSavingCoverage] = useState(false);

  // Stop coverage flow state
  const [awaitingStopCoverageConfirmation, setAwaitingStopCoverageConfirmation] = useState(false);
  const [pendingStopCoverageId, setPendingStopCoverageId] = useState<string | null>(null);
  const [awaitingAddAfterStop, setAwaitingAddAfterStop] = useState(false);

  // Record request flow state
  const [showRecordRequestFlow, setShowRecordRequestFlow] = useState(false);

  // Form filling state
  const [isFormFillingMode, setIsFormFillingMode] = useState(false);
  const [userProfileData, setUserProfileData] = useState<UserProfileData | null>(null);
  const [formFields, setFormFields] = useState<string[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [awaitingProfileDataConfirmation, setAwaitingProfileDataConfirmation] = useState(false);
  const [collectingProfileData, setCollectingProfileData] = useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [collectedData, setCollectedData] = useState<any>({});
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Resolve the authenticated user ID once on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages([{
      type: 'assistant',
      message: getInitialMessage()
    }]);
    setHasShownImportPrompt(false);
    setAwaitingImportResponse(false);
    setShowInsuranceFlow(false);
    setShowProviderConnectionFlow(false);
    setShowRecordRequestFlow(false);
    setIsFormFillingMode(false);
    setAwaitingProfileDataConfirmation(false);
    setCollectingProfileData(false);
    setCurrentFieldIndex(0);
    setCollectedData({});
    setConversationHistory([]);
  }, [currentPage]);

  useEffect(() => {
    if (startProviderConnectionProp) {
      setShowProviderConnectionFlow(true);
      onProviderConnectionStarted?.();
    }
  }, [startProviderConnectionProp]);

  useEffect(() => {
    if (currentPage === 'medical-profile' && !hasShownImportPrompt) {
      const hasSeenPrompt = localStorage.getItem('hasSeenMedicalImportPrompt');
      if (!hasSeenPrompt) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            type: 'assistant',
            message: "Can I help you import your medical profile records?\n\n1. Yes\n2. No"
          }]);
          setHasShownImportPrompt(true);
          setAwaitingImportResponse(true);
          localStorage.setItem('hasSeenMedicalImportPrompt', 'true');
        }, 1500);
      }
    }

    if (currentPage === 'care' && !hasShownImportPrompt) {
      const hasSeenCarePrompt = localStorage.getItem('hasSeenCarePagePrompt');
      if (!hasSeenCarePrompt) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            type: 'assistant',
            message: "You're on your Care page. I can look up your medications, care timeline, or encounters — just ask. You can also say \"connect a provider\" to import records."
          }]);
          setHasShownImportPrompt(true);
          localStorage.setItem('hasSeenCarePagePrompt', 'true');
        }, 1500);
      }
    }
  }, [currentPage, hasShownImportPrompt]);

  const handleStartProviderConnection = () => {
    setShowProviderConnectionFlow(true);
  };

  const handleProviderConnectionClose = () => {
    setShowProviderConnectionFlow(false);
  };

  const handleProviderConnectionImportComplete = (data: any) => {
    setShowProviderConnectionFlow(false);
    setMessages(prev => [...prev, {
      type: 'assistant',
      message: 'Your records have been imported successfully. You can find your updated data in your Medical Profile.'
    }]);
    if (onImportComplete) onImportComplete(data);
  };

  const isFillFormIntent = (text: string) => {
    const lower = text.toLowerCase();
    return lower.includes('fill') && (lower.includes('form') || lower.includes('incomplete'));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    setMessages(prev => [...prev, {
      type: 'user',
      message: userMessage
    }]);

    if (awaitingImportResponse && (userMessage === '1' || userMessage.toLowerCase() === 'yes')) {
      setAwaitingImportResponse(false);
      handleStartProviderConnection();
      return;
    }

    if (awaitingImportResponse && (userMessage === '2' || userMessage.toLowerCase() === 'no')) {
      setAwaitingImportResponse(false);
      setMessages(prev => [...prev, {
        type: 'assistant',
        message: "No problem! Feel free to ask me anything else or use the quick actions below to manage your health profile."
      }]);
      return;
    }

    if (awaitingStopCoverageConfirmation) {
      if (userMessage.toLowerCase() === 'yes') {
        await handleConfirmStopCoverage();
      } else {
        setAwaitingStopCoverageConfirmation(false);
        setPendingStopCoverageId(null);
        setMessages(prev => [...prev, {
          type: 'assistant',
          message: "No problem! Your coverage remains active. How else can I help you?"
        }]);
      }
      return;
    }

    if (awaitingAddAfterStop) {
      if (userMessage.toLowerCase() === 'yes') {
        setAwaitingAddAfterStop(false);
        handleStartInsuranceFlow();
      } else {
        setAwaitingAddAfterStop(false);
        setMessages(prev => [...prev, {
          type: 'assistant',
          message: "Understood. Let me know if you need anything else!"
        }]);
      }
      return;
    }

    if (awaitingProfileDataConfirmation) {
      if (userMessage.toLowerCase() === 'yes') {
        setAwaitingProfileDataConfirmation(false);
        handleStartDataCollection();
      } else {
        setAwaitingProfileDataConfirmation(false);
        setMessages(prev => [...prev, {
          type: 'assistant',
          message: "No problem! I've shown you the available information above. You can copy it to fill out your form. Let me know if you need anything else!"
        }]);
      }
      return;
    }

    if (collectingProfileData) {
      await handleCollectFieldData(userMessage);
      return;
    }

    if (isFillFormIntent(userMessage)) {
      await handleFormFillingRequest();
      return;
    }

    const stopCoverageMatch = userMessage.match(/stop.*(?:coverage|insurance).*(?:for|with)?\s+(.+)/i);
    if (stopCoverageMatch) {
      const providerName = stopCoverageMatch[1].trim();
      await handleInitiateStopCoverage(providerName);
      return;
    }

    setIsLoading(true);

    try {
      const updatedHistory: ConversationMessage[] = [
        ...conversationHistory,
        { role: 'user', content: userMessage },
      ];
      const data = await sendChatMessage({
        message: userMessage,
        page: currentPage,
        pageContext: buildPageContext(currentPage),
        conversationHistory: updatedHistory,
      });
      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant', content: data.message },
      ]);
      setMessages(prev => [...prev, {
        type: 'assistant',
        message: data.message
      }]);
    } catch (error) {
      console.error('Error calling AI:', error);
      setMessages(prev => [...prev, {
        type: 'assistant',
        message: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (prompt: string) => {
    setMessages(prev => [...prev, {
      type: 'user',
      message: prompt
    }]);

    setIsLoading(true);

    if (prompt.toLowerCase().includes('request health records') || prompt.toLowerCase().includes('request medical records')) {
      setIsLoading(false);
      setMessages(prev => [...prev, {
        type: 'assistant',
        message: "I'll help you send a record request to your provider. Fill out the form below and I'll take care of the rest."
      }]);
      setShowRecordRequestFlow(true);
      return;
    }

    if (prompt.toLowerCase().includes('import') && (prompt.toLowerCase().includes('record') || prompt.toLowerCase().includes('health'))) {
      setIsLoading(false);
      handleStartProviderConnection();
      return;
    }

    if (prompt.toLowerCase().includes('connect') && prompt.toLowerCase().includes('provider')) {
      setIsLoading(false);
      handleStartProviderConnection();
      return;
    }

    if (prompt === 'I need to refill my medication') {
      await handleMedicationRefillFlow();
      return;
    }

    if (prompt === 'I want to schedule an appointment') {
      await handleScheduleAppointmentFlow();
      return;
    }

    if (isFillFormIntent(prompt)) {
      await handleFormFillingRequest();
      return;
    }

    try {
      const updatedHistory: ConversationMessage[] = [
        ...conversationHistory,
        { role: 'user', content: prompt },
      ];
      const data = await sendChatMessage({
        message: prompt,
        page: currentPage,
        pageContext: buildPageContext(currentPage),
        conversationHistory: updatedHistory,
      });
      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant', content: data.message },
      ]);
      setMessages(prev => [...prev, {
        type: 'assistant',
        message: data.message
      }]);
    } catch (error) {
      console.error('Error calling AI:', error);
      setMessages(prev => [...prev, {
        type: 'assistant',
        message: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMedicationRefillFlow = async () => {
    setMessages(prev => [...prev, {
      type: 'assistant',
      message: "Medication refills through the app aren't supported yet. Please contact your pharmacy or prescribing provider directly to request a refill. You can find your provider's contact info in your Care Network."
    }]);
    setIsLoading(false);
  };

  const handleScheduleAppointmentFlow = async () => {
    setMessages(prev => [...prev, {
      type: 'assistant',
      message: "Appointment scheduling through the app isn't supported yet. Please contact your provider's office directly to schedule an appointment. You can find contact info for your providers in your Care Network."
    }]);
    setIsLoading(false);
  };

  const handleFormFillingRequest = async () => {
    setIsLoading(true);

    setMessages(prev => [...prev, {
      type: 'assistant',
      message: "I'll pre-fill your incomplete forms using your profile and medical data..."
    }]);

    try {
      const userId = currentUserId;
      if (!userId) throw new Error('Not authenticated');

      const patientProfileId = await getPatientProfileId(userId);
      if (!patientProfileId) throw new Error('Patient profile not found');

      const [autofill, responses] = await Promise.all([
        loadFormAutofillContext(userId),
        loadFormResponses(patientProfileId),
      ]);

      const incomplete = FORM_TEMPLATES.filter((template) => !isResponseComplete(responses[template.id]));
      if (incomplete.length === 0) {
        setMessages(prev => [...prev, {
          type: 'assistant',
          message: 'All your forms are already complete. Open Medical Forms to review or share them with a provider.'
        }]);
        setIsFormFillingMode(false);
        return;
      }

      const filledSummaries: string[] = [];
      let totalFields = 0;

      for (const template of incomplete) {
        const saved = responses[template.id]?.answers_json;
        const answers = mergeFormAnswers(saved, buildAutofillAnswers(template, autofill));
        const fieldCount = Object.keys(answers).length;
        if (fieldCount === 0) continue;

        await saveFormResponse({
          patientProfileId,
          templateId: template.id,
          answers,
          markComplete: false,
        });

        totalFields += fieldCount;
        filledSummaries.push(`• **${template.title}** — ${fieldCount} fields pre-filled`);
      }

      if (filledSummaries.length === 0) {
        setMessages(prev => [...prev, {
          type: 'assistant',
          message: "I couldn't find profile data to pre-fill your forms yet. Complete your Medical Profile and Insurance sections, then try again."
        }]);
        setIsFormFillingMode(false);
        return;
      }

      const summary = [
        `Pre-filled **${filledSummaries.length}** form${filledSummaries.length !== 1 ? 's' : ''} (${totalFields} fields total):`,
        '',
        ...filledSummaries,
        '',
        'Open **Medical Forms** to review, finish any remaining fields, and save. Ask me to share a completed form when you\'re ready.',
      ].join('\n');

      setMessages(prev => [...prev, {
        type: 'assistant',
        message: summary
      }]);

      setIsFormFillingMode(true);
    } catch (error) {
      console.error('Error pre-filling forms:', error);
      setMessages(prev => [...prev, {
        type: 'assistant',
        message: "I'm sorry, I had trouble pre-filling your forms. Open Medical Forms to edit them directly, or try again in a moment."
      }]);
      setIsFormFillingMode(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartDataCollection = () => {
    setCollectingProfileData(true);
    setCurrentFieldIndex(0);
    setCollectedData({});

    const fieldPrompts: { [key: string]: string } = {
      'Full Name': "What's your full name? (First and Last)",
      'Date of Birth': "What's your date of birth? (MM/DD/YYYY)",
      'Email': "What's your email address?",
      'Phone Number': "What's your phone number?",
      'Address': "What's your street address?",
    };

    const firstField = missingFields[0];
    const prompt = fieldPrompts[firstField] || `Please provide your ${firstField}:`;

    setMessages(prev => [...prev, {
      type: 'assistant',
      message: `Great! Let's gather your information. ${prompt}\n\n(Type "skip" if you want to skip any field)`
    }]);
  };

  const handleCollectFieldData = async (value: string) => {
    const currentField = missingFields[currentFieldIndex];
    const newData = { ...collectedData };

    if (value.toLowerCase() === 'skip') {
      setMessages(prev => [...prev, {
        type: 'assistant',
        message: `Okay, I'll skip ${currentField} for now.`
      }]);
    } else {
      switch (currentField) {
        case 'Full Name':
          const nameParts = value.trim().split(' ');
          if (nameParts.length >= 2) {
            newData.firstName = nameParts[0];
            newData.lastName = nameParts.slice(1).join(' ');
          } else {
            newData.firstName = value.trim();
          }
          break;
        case 'Date of Birth':
          newData.dateOfBirth = value.trim();
          break;
        case 'Email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            setMessages(prev => [...prev, {
              type: 'assistant',
              message: "That doesn't look like a valid email address. Please try again with a format like: name@example.com"
            }]);
            return;
          }
          newData.email = value.trim();
          break;
        case 'Phone Number':
          newData.phone = value.trim();
          break;
        case 'Address':
          if (!newData.address) newData.address = {};
          newData.address.street = value.trim();
          break;
      }
    }

    setCollectedData(newData);

    if (currentFieldIndex < missingFields.length - 1) {
      const nextIndex = currentFieldIndex + 1;
      setCurrentFieldIndex(nextIndex);

      const fieldPrompts: { [key: string]: string } = {
        'Full Name': "What's your full name? (First and Last)",
        'Date of Birth': "What's your date of birth? (MM/DD/YYYY)",
        'Email': "What's your email address?",
        'Phone Number': "What's your phone number?",
        'Address': "What's your street address?",
      };

      const nextField = missingFields[nextIndex];
      const prompt = fieldPrompts[nextField] || `Please provide your ${nextField}:`;

      setMessages(prev => [...prev, {
        type: 'assistant',
        message: `Got it! ${prompt}`
      }]);
    } else {
      setCollectingProfileData(false);
      setIsLoading(true);

      setMessages(prev => [...prev, {
        type: 'assistant',
        message: "Perfect! Let me save this information to your profile..."
      }]);

      await new Promise(resolve => setTimeout(resolve, 600));

      const userId = currentUserId;
      if (!userId) throw new Error('Not authenticated');
      const success = await updateUserProfile(userId, newData);

      if (success) {
        const updatedProfile = await fetchUserProfileData(userId);
        setUserProfileData(updatedProfile);

        let summary = "Your profile has been updated! Here's your complete information:\n\n";

        if (updatedProfile.personalInfo.fullName) {
          summary += `**Name**: ${updatedProfile.personalInfo.fullName}\n`;
        }
        if (updatedProfile.personalInfo.dateOfBirth) {
          const dob = new Date(updatedProfile.personalInfo.dateOfBirth);
          summary += `**Date of Birth**: ${dob.toLocaleDateString()}\n`;
        }
        if (updatedProfile.personalInfo.email) {
          summary += `**Email**: ${updatedProfile.personalInfo.email}\n`;
        }
        if (updatedProfile.personalInfo.phone) {
          summary += `**Phone**: ${updatedProfile.personalInfo.phone}\n`;
        }
        if (updatedProfile.personalInfo.address?.street) {
          summary += `**Address**: ${updatedProfile.personalInfo.address.street}\n`;
        }

        summary += "\nYou can now use this information to fill out your form!";

        setMessages(prev => [...prev, {
          type: 'assistant',
          message: summary
        }]);
      } else {
        setMessages(prev => [...prev, {
          type: 'assistant',
          message: "I'm sorry, there was an error saving your profile. Please try again or update it manually in the Medical Profile section."
        }]);
      }

      setIsLoading(false);
      setIsFormFillingMode(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOpenManualRequest = () => {
    setShowProviderConnectionFlow(false);
    onRequestRecords?.();
  };

  const handleRecordRequestComplete = (result: { providerName: string; emailSent: boolean; emailError?: string }) => {
    setShowRecordRequestFlow(false);
    if (result.emailSent) {
      setMessages(prev => [...prev, {
        type: 'assistant',
        message: `Your record request has been sent to ${result.providerName}. You'll be notified when the provider responds. You can track the status on your Health Records page.`
      }]);
    } else {
      setMessages(prev => [...prev, {
        type: 'assistant',
        message: `Your request to ${result.providerName} has been saved, but the email could not be delivered${result.emailError ? `: ${result.emailError}` : '.'}. You can check the status on your Health Records page.`
      }]);
    }
    if (onRefreshData) {
      onRefreshData();
    }
  };

  const handleRecordRequestCancel = () => {
    setShowRecordRequestFlow(false);
    setMessages(prev => [...prev, {
      type: 'assistant',
      message: "No problem! Let me know if you'd like to request records later."
    }]);
  };

  const loadProviders = async () => {
    setLoadingProviders(true);
    try {
      const { data, error } = await supabase
        .from('insurance_providers')
        .select('*')
        .order('is_popular', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;

      const mappedProviders: InsuranceProvider[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        payerId: p.payer_id,
        logoUrl: p.logo_url,
        slug: p.slug,
        isPopular: p.is_popular,
        createdAt: p.created_at,
      }));

      setProviders(mappedProviders);
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleStartInsuranceFlow = () => {
    setShowInsuranceFlow(true);
    setInsuranceStep('picker');
    setSelectedProvider(null);
    loadProviders();
  };

  const handleInitiateStopCoverage = async (providerName: string) => {
    try {
      const userId = currentUserId;
      if (!userId) throw new Error('Not authenticated');
      const { data: coverages, error } = await supabase
        .from('insurance_coverages')
        .select('id, provider_id, insurance_providers!inner(name)')
        .eq('user_id', userId)
        .eq('coverage_status', 'active')
        .ilike('insurance_providers.name', `%${providerName}%`);

      if (error) throw error;

      if (!coverages || coverages.length === 0) {
        setMessages(prev => [...prev, {
          type: 'assistant',
          message: `I couldn't find an active ${providerName} coverage. Could you clarify which insurance provider you'd like to stop?`
        }]);
        return;
      }

      const coverage = coverages[0];
      setPendingStopCoverageId(coverage.id);
      setAwaitingStopCoverageConfirmation(true);

      setMessages(prev => [...prev, {
        type: 'assistant',
        message: `Are you sure you want to stop your ${providerName} coverage? This will mark it as inactive but keep it in your history. Please reply with "yes" to confirm or "no" to cancel.`
      }]);
    } catch (error) {
      console.error('Error finding coverage:', error);
      setMessages(prev => [...prev, {
        type: 'assistant',
        message: "I'm sorry, I had trouble finding that coverage. Please try again."
      }]);
    }
  };

  const handleConfirmStopCoverage = async () => {
    if (!pendingStopCoverageId) return;

    try {
      const { error } = await supabase
        .from('insurance_coverages')
        .update({
          coverage_status: 'stopped',
          stopped_at: new Date().toISOString(),
          is_primary: false,
        })
        .eq('id', pendingStopCoverageId);

      if (error) throw error;

      setMessages(prev => [...prev, {
        type: 'assistant',
        message: "Your coverage has been stopped successfully. Would you like to add a new insurance provider? Reply with 'yes' to add new coverage or 'no' if you're done."
      }]);

      setAwaitingStopCoverageConfirmation(false);
      setPendingStopCoverageId(null);
      setAwaitingAddAfterStop(true);

      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (error) {
      console.error('Error stopping coverage:', error);
      setMessages(prev => [...prev, {
        type: 'assistant',
        message: "I'm sorry, there was an error stopping your coverage. Please try again."
      }]);
      setAwaitingStopCoverageConfirmation(false);
      setPendingStopCoverageId(null);
    }
  };

  const handleSelectProvider = (provider: InsuranceProvider) => {
    setSelectedProvider(provider);
    setInsuranceStep('form');
  };

  const handleInsuranceBack = () => {
    if (insuranceStep === 'form') {
      setInsuranceStep('picker');
      setSelectedProvider(null);
    } else {
      setShowInsuranceFlow(false);
      setProviderSearchQuery('');
    }
  };

  const handleInsuranceCancel = () => {
    setShowInsuranceFlow(false);
    setInsuranceStep('picker');
    setSelectedProvider(null);
    setProviderSearchQuery('');
  };

  const handleInsuranceSubmit = async (coverage: Partial<Coverage>) => {
    setSavingCoverage(true);
    try {
      // Generate a simple hash of the member ID for storage (in production, use proper encryption)
      const memberIdHash = coverage.memberId || '';

      if (!currentUserId) throw new Error('Not authenticated');
      const insertData = {
        user_id: currentUserId,
        provider_id: coverage.providerId,
        plan_name: coverage.planName,
        member_id_hash: memberIdHash,
        group_number: coverage.groupNumber || null,
        bin: coverage.bin || null,
        pcn: coverage.pcn || null,
        relationship: coverage.relationship || 'self',
        effective_start: coverage.effectiveStart,
        effective_end: coverage.effectiveEnd || null,
        is_primary: coverage.isPrimary || false,
        source: coverage.source || 'manual',
        verification_status: 'connected',
      };

      console.log('Attempting insert with data:', insertData);

      // Save to database
      const { data, error } = await supabase
        .from('insurance_coverages')
        .insert(insertData)
        .select()
        .single();

      console.log('Insert result:', { data, error });

      if (error) {
        console.error('Full error details:', JSON.stringify(error, null, 2));
        console.error('Error code:', error.code);
        console.error('Error hint:', error.hint);
        console.error('Error details:', error.details);
        throw error;
      }

      // Store the submitted coverage for confirmation display
      setSubmittedCoverage(coverage);
      setInsuranceStep('confirmation');

      // Refresh the main page data
      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (error: any) {
      console.error('Error saving coverage:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      setMessages(prev => [...prev, {
        type: 'assistant',
        message: `I'm sorry, there was an error saving your insurance coverage: ${errorMessage}. Please try again.`
      }]);
      setInsuranceStep('form');
      setSavingCoverage(false);
    } finally {
      setSavingCoverage(false);
    }
  };

  const handleInsuranceComplete = () => {
    // Add success message to chat
    setMessages(prev => [...prev, {
      type: 'assistant',
      message: "Your insurance coverage has been successfully added! I've updated your profile with all the details. What else would you like to do today?"
    }]);

    // Reset insurance flow
    setShowInsuranceFlow(false);
    setInsuranceStep('picker');
    setSelectedProvider(null);
    setSubmittedCoverage(null);
    setProviderSearchQuery('');
  };

  const getQuickActions = () => {
    if (currentPage === 'medical-profile') {
      return [
        { icon: LinkIcon, label: 'Connect Provider', action: handleStartProviderConnection },
        { icon: ClipboardCheck, label: 'Fill Form', prompt: 'Help me fill out my incomplete forms' },
        { icon: Stethoscope, label: 'Add Condition', action: onAddCondition },
        { icon: Pill, label: 'Add Medication', action: onAddMedication },
        { icon: AlertTriangle, label: 'Add Allergy', action: onAddAllergy }
      ];
    }

    if (currentPage === 'care') {
      return [
        { icon: Pill, label: 'Refill Medication', prompt: 'I need to refill my medication' },
        { icon: Calendar, label: 'Schedule Appointment', prompt: 'I want to schedule an appointment' },
        { icon: ClipboardCheck, label: 'Fill Form', prompt: 'Help me fill out my incomplete forms' },
        { icon: FileText, label: 'Care Summary', prompt: 'Give me a summary of my recent care activities' }
      ];
    }

    if (currentPage === 'insurance') {
      return [
        { icon: ShieldCheck, label: 'Add Coverage', action: handleStartInsuranceFlow },
        { icon: ClipboardCheck, label: 'Fill Form', prompt: 'Help me fill out my incomplete forms' },
        { icon: FileText, label: 'View Benefits', prompt: 'What benefits does my insurance cover?' },
        { icon: Building2, label: 'Find Providers', prompt: 'Help me find in-network providers' }
      ];
    }

    if (currentPage === 'network') {
      return [
        { icon: Users, label: 'Add Provider', action: onAddProvider },
        { icon: Building2, label: 'Add Pharmacy', action: onAddPharmacy },
        { icon: ClipboardCheck, label: 'Fill Form', prompt: 'Help me fill out my incomplete forms' },
        { icon: Search, label: 'Find Specialist', action: onFindSpecialist }
      ];
    }

    if (currentPage === 'health-records') {
      return [
        { icon: LinkIcon, label: 'Connect Provider', action: handleStartProviderConnection },
        { icon: SendHorizontal, label: 'Request Records', prompt: 'Request health records manually' },
        { icon: FlaskConical, label: 'Show my lab results', prompt: 'Show my lab results' },
        { icon: Upload, label: 'Upload a new record', prompt: 'I want to upload a new health record' }
      ];
    }

    return [
      { icon: ClipboardCheck, label: 'Fill Form', prompt: 'Help me fill out my incomplete forms' },
      { icon: FileText, label: 'Show my forms', prompt: 'What forms do I need to complete?' },
      { icon: Calendar, label: 'Check appointments', prompt: 'When is my next appointment?' },
      { icon: Pill, label: 'View medications', prompt: 'What medications am I taking?' }
    ];
  };

  const quickActions = getQuickActions();

  const getSuggestions = () => {
    if (currentPage === 'medical-profile') {
      return [
        'Fill out this form for me',
        'Connect my provider to import records',
        'What conditions should I track?',
        'Review my medication list'
      ];
    }
    if (currentPage === 'insurance') {
      return [
        'Fill out this form for me',
        'Add insurance coverage',
        'What benefits do I have?',
        'Find in-network providers'
      ];
    }
    if (currentPage === 'health-records') {
      return [
        'Connect my provider to import records',
        'Request health records manually',
        'Show my lab results',
        'Upload a new record'
      ];
    }
    return [
      'Fill out this form for me',
      'Show my health summary',
      'Schedule an appointment',
      'Refill my medications'
    ];
  };

  const suggestions = getSuggestions();

  return (
    <aside
      data-steel-chrome="assistant"
      className="flex h-full w-full min-h-0 flex-col border-l border-stroke-default bg-transparent"
    >
      {showProviderConnectionFlow ? (
        <ProviderRecordConnectionFlow
          onClose={handleProviderConnectionClose}
          onImportComplete={handleProviderConnectionImportComplete}
          onRefreshData={onRefreshData}
          onOpenManualRequest={handleOpenManualRequest}
          darkMode={darkMode}
        />
      ) : (
        <>
          <div className="flex-shrink-0 border-b border-stroke-default bg-transparent p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg border border-stroke-default bg-surface-sunken/80 backdrop-blur-sm">
                <MessageCircle className="w-5 h-5 text-content-primary" />
              </div>
              <h2 className="text-lg font-semibold text-content-primary">
                Health Assistant
              </h2>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-surface-page p-6">
            {showInsuranceFlow ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={handleInsuranceBack}
                    className="rounded-lg p-2 transition-colors hover:bg-surface-sunken"
                  >
                    <ArrowLeft className="h-5 w-5 text-content-secondary" />
                  </button>
                  <h3 className="text-lg font-semibold text-content-primary">
                    {insuranceStep === 'picker' ? 'Select Insurance Provider' : `Connect ${selectedProvider?.name}`}
                  </h3>
                </div>

                {insuranceStep === 'picker' && (
                  <>
                    <div className="relative mb-4 text-content-primary">
                      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-content-secondary" />
                      <input
                        type="text"
                        placeholder="Search providers..."
                        value={providerSearchQuery}
                        onChange={(e) => setProviderSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-stroke-default bg-surface-sunken py-3 pl-10 pr-4 text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-stroke-focus"
                      />
                    </div>

                    {loadingProviders ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-action-primary" />
                      </div>
                    ) : (
                      <>
                        {providers.filter(p => p.isPopular && (!providerSearchQuery || p.name.toLowerCase().includes(providerSearchQuery.toLowerCase()))).length > 0 && (
                          <div className="mb-6">
                            <h4 className="mb-3 text-sm font-medium text-content-secondary">
                              Popular Providers
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {providers
                                .filter(p => p.isPopular && (!providerSearchQuery || p.name.toLowerCase().includes(providerSearchQuery.toLowerCase())))
                                .map((provider) => (
                                  <button
                                    key={provider.id}
                                    onClick={() => handleSelectProvider(provider)}
                                    className="flex items-center gap-3 rounded-lg border border-stroke-default p-3 text-left transition-all hover:border-stroke-strong hover:bg-surface-sunken"
                                  >
                                    {provider.logoUrl && (
                                      <img
                                        src={provider.logoUrl}
                                        alt={provider.name}
                                        className="w-8 h-8 rounded"
                                      />
                                    )}
                                    <span className="text-sm font-medium text-content-primary">
                                      {provider.name}
                                    </span>
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}

                        {providers.filter(p => !p.isPopular && (!providerSearchQuery || p.name.toLowerCase().includes(providerSearchQuery.toLowerCase()))).length > 0 && (
                          <div>
                            <h4 className="mb-3 text-sm font-medium text-content-secondary">
                              All Providers
                            </h4>
                            <div className="space-y-2">
                              {providers
                                .filter(p => !p.isPopular && (!providerSearchQuery || p.name.toLowerCase().includes(providerSearchQuery.toLowerCase())))
                                .map((provider) => (
                                  <button
                                    key={provider.id}
                                    onClick={() => handleSelectProvider(provider)}
                                    className="flex w-full items-center gap-3 rounded-lg border border-stroke-default p-3 text-left transition-all hover:border-stroke-strong hover:bg-surface-sunken"
                                  >
                                    {provider.logoUrl && (
                                      <img
                                        src={provider.logoUrl}
                                        alt={provider.name}
                                        className="w-8 h-8 rounded"
                                      />
                                    )}
                                    <span className="font-medium text-content-primary">
                                      {provider.name}
                                    </span>
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {insuranceStep === 'form' && selectedProvider && !savingCoverage && (
                  <ConnectMethodTabs
                    provider={selectedProvider}
                    onSubmit={handleInsuranceSubmit}
                    onCancel={handleInsuranceCancel}
                    darkMode={darkMode}
                  />
                )}

                {savingCoverage && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                    <p className="text-sm text-content-secondary">
                      Saving your coverage...
                    </p>
                  </div>
                )}

                {insuranceStep === 'confirmation' && selectedProvider && submittedCoverage && (
                  <div className="space-y-6">
                    <div className={`rounded-lg p-6 ${
                      darkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
                    }`}>
                      <div className="flex items-start gap-3 mb-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-full flex-shrink-0">
                          <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className={`text-lg font-semibold mb-1 ${
                            darkMode ? 'text-green-300' : 'text-green-900'
                          }`}>
                            Coverage Successfully Added!
                          </h3>
                          <p className={`text-sm ${
                            darkMode ? 'text-green-400' : 'text-green-700'
                          }`}>
                            Your insurance information has been saved to your profile.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-stroke-default bg-surface-sunken p-6">
                      <h4 className="mb-4 text-sm font-semibold text-content-primary">
                        Coverage Summary
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-content-secondary">
                            Provider
                          </label>
                          <p className="text-sm mt-1 text-content-primary">
                            {selectedProvider.name}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-content-secondary">
                            Plan Name
                          </label>
                          <p className="text-sm mt-1 text-content-primary">
                            {submittedCoverage.planName}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-medium text-content-secondary">
                              Member ID
                            </label>
                            <p className="text-sm mt-1 font-mono text-content-primary">
                              {submittedCoverage.memberId}
                            </p>
                          </div>
                          {submittedCoverage.groupNumber && (
                            <div>
                              <label className="text-xs font-medium text-content-secondary">
                                Group Number
                              </label>
                              <p className="text-sm mt-1 font-mono text-content-primary">
                                {submittedCoverage.groupNumber}
                              </p>
                            </div>
                          )}
                        </div>
                        {(submittedCoverage.bin || submittedCoverage.pcn) && (
                          <div className="grid grid-cols-2 gap-4">
                            {submittedCoverage.bin && (
                              <div>
                                <label className="text-xs font-medium text-content-secondary">
                                  BIN
                                </label>
                                <p className="text-sm mt-1 font-mono text-content-primary">
                                  {submittedCoverage.bin}
                                </p>
                              </div>
                            )}
                            {submittedCoverage.pcn && (
                              <div>
                                <label className="text-xs font-medium text-content-secondary">
                                  PCN
                                </label>
                                <p className="text-sm mt-1 font-mono text-content-primary">
                                  {submittedCoverage.pcn}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-medium text-content-secondary">
                              Relationship
                            </label>
                            <p className="text-sm mt-1 capitalize text-content-primary">
                              {submittedCoverage.relationship}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-content-secondary">
                              Effective Start
                            </label>
                            <p className="text-sm mt-1 text-content-primary">
                              {submittedCoverage.effectiveStart ? new Date(submittedCoverage.effectiveStart).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedProvider && (
                      <div className="rounded-lg border border-stroke-default bg-surface-sunken p-6">
                        <h4 className="mb-4 text-sm font-semibold text-content-primary">
                          Provider Contact Information
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div>
                            <label className="text-xs font-medium text-content-secondary">
                              Customer Service
                            </label>
                            <p className="mt-1 text-content-primary">
                              Available Monday - Friday, 8:00 AM - 8:00 PM EST
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-content-secondary">
                              Phone
                            </label>
                            <a href="tel:1-800-555-0100" className="mt-1 block text-action-primary hover:text-action-primary-hover">
                              1-800-555-0100
                            </a>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-content-secondary">
                              Website
                            </label>
                            <a
                              href={`https://www.${selectedProvider.slug || selectedProvider.name.toLowerCase().replace(/\s+/g, '')}.com`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 block text-action-primary hover:text-action-primary-hover"
                            >
                              View Member Portal
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleInsuranceComplete}
                      className="w-full rounded-lg bg-action-primary px-6 py-3 font-medium text-content-on-action transition-colors hover:bg-action-primary-hover"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {messages.length === 1 && (
                  <div className="space-y-6">
                    <div className="bg-surface-sunken rounded-2xl p-6">
                      <p className="text-base leading-relaxed text-content-primary">
                        Hello! I'm your AI health assistant. I can help you manage your health records, schedule appointments, track vitals, and answer medical questions.
                      </p>
                      <p className="text-sm text-content-secondary mt-2">Just now</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-content-secondary" />
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
                          Suggestions
                        </h3>
                      </div>
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickAction(suggestion)}
                          className="hv-surface-card hv-surface-card--interactive w-full rounded-xl px-5 py-3.5 text-left text-sm text-content-primary transition-all hover:bg-action-secondary"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.length > 1 && (
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.type === 'assistant' && (
                          <div className="bg-surface-sunken rounded-2xl px-5 py-4 max-w-[85%]">
                            <p className="text-sm leading-relaxed text-content-primary whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        )}
                        {msg.type === 'user' && (
                          <div className="max-w-[85%] rounded-2xl bg-action-primary px-5 py-4">
                            <p className="text-sm leading-relaxed text-content-on-action">{msg.message}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-surface-sunken rounded-2xl px-5 py-4">
                          <Loader2 className="w-4 h-4 animate-spin text-content-secondary" />
                        </div>
                      </div>
                    )}
                    {showRecordRequestFlow && (
                      <div className="flex justify-start">
                        <div className="w-full max-w-[95%]">
                          <InlineRecordRequestForm
                            onComplete={handleRecordRequestComplete}
                            onCancel={handleRecordRequestCancel}
                            onRequestSent={onRefreshData ? () => onRefreshData() : undefined}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            {!showInsuranceFlow && !showProviderConnectionFlow && <div ref={messagesEndRef} />}
          </div>

          {!showInsuranceFlow && (
            <div className="flex-shrink-0 border-t border-stroke-default bg-transparent p-6">
              <div className="flex gap-3 items-end">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask your health assistant anything..."
                  disabled={isLoading}
                  className={`flex-1 rounded-xl border border-stroke-default bg-surface-sunken px-4 py-3.5 text-sm text-content-primary placeholder:text-content-tertiary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-stroke-focus ${
                    isLoading ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading}
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-action-primary text-content-on-action transition-all hover:scale-105 hover:bg-action-primary-hover ${
                    isLoading ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
