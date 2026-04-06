import { Send, Sparkles, FileText, Building2, Calendar, Pill, Loader2, Stethoscope, AlertTriangle, Link as LinkIcon, Users, ShieldCheck, Search, X, ArrowLeft, Upload, FlaskConical, MessageCircle, ClipboardCheck, SendHorizontal } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { ProviderRecordConnectionFlow } from './records/ProviderRecordConnectionFlow';
import { InlineRecordRequestForm } from './records/InlineRecordRequestForm';
import { InsuranceProvider, Coverage } from '../schemas/insurance';
import { ConnectMethodTabs } from './insurance/ConnectMethodTabs';
import { supabase } from '../lib/supabase';
import { getVoiceMessageForContext, type PageContext } from '../lib/voice/context-messages';
import { fetchUserProfileData, updateUserProfile, type UserProfileData } from '../lib/services/profile-data';
import { sendAssistantMessage } from '../lib/openai/client';
import { buildPageContext } from '../lib/openai/context';

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
  const [lastResponseId, setLastResponseId] = useState<string | undefined>(undefined);

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
    setLastResponseId(undefined);
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
            message: "I noticed you're viewing your Care page. Here are some insights:\n\n• You haven't had an annual physical in over 12 months\n• Consider scheduling preventive care appointments\n• Would you like to import recent visit data from your providers?"
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

    const stopCoverageMatch = userMessage.match(/stop.*(?:coverage|insurance).*(?:for|with)?\s+(.+)/i);
    if (stopCoverageMatch) {
      const providerName = stopCoverageMatch[1].trim();
      await handleInitiateStopCoverage(providerName);
      return;
    }

    setIsLoading(true);

    try {
      const data = await sendAssistantMessage({
        message: userMessage,
        page: currentPage,
        pageContext: buildPageContext(currentPage),
        previousResponseId: lastResponseId,
      });

      setLastResponseId(data.responseId);
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

    try {
      const data = await sendAssistantMessage({
        message: prompt,
        page: currentPage,
        pageContext: buildPageContext(currentPage),
        previousResponseId: lastResponseId,
      });

      setLastResponseId(data.responseId);
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
    await new Promise(resolve => setTimeout(resolve, 800));

    setMessages(prev => [...prev, {
      type: 'assistant',
      message: "I can help you refill your medication. Which medication would you like to refill?\n\n1. Albuterol Inhaler (3 refills remaining)\n2. Fluticasone Propionate (2 refills remaining)\n3. Montelukast (5 refills remaining)\n\nPlease reply with the number or name of the medication."
    }]);

    setIsLoading(false);
  };

  const handleScheduleAppointmentFlow = async () => {
    await new Promise(resolve => setTimeout(resolve, 800));

    setMessages(prev => [...prev, {
      type: 'assistant',
      message: "I'd be happy to help you schedule an appointment. What type of appointment do you need?\n\n1. Primary Care Visit\n2. Specialist Consultation\n3. Annual Physical\n4. Follow-up Appointment\n\nPlease reply with the number or describe what you need."
    }]);

    setIsLoading(false);
  };

  const handleFormFillingRequest = async () => {
    setIsLoading(true);

    setMessages(prev => [...prev, {
      type: 'assistant',
      message: "I'll help you fill out the form with your profile information. Let me gather your data..."
    }]);

    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      const userId = '00000000-0000-0000-0000-000000000000';
      const profileData = await fetchUserProfileData(userId);
      setUserProfileData(profileData);

      let formSummary = "Based on your profile, here's what I can help you fill in:\n\n";
      const availableFields: string[] = [];
      const missingInfo: string[] = [];

      if (profileData.personalInfo.fullName) {
        formSummary += `**Name**: ${profileData.personalInfo.fullName}\n`;
        availableFields.push('name');
      } else {
        missingInfo.push('Full Name');
      }

      if (profileData.personalInfo.dateOfBirth) {
        const dob = new Date(profileData.personalInfo.dateOfBirth);
        formSummary += `**Date of Birth**: ${dob.toLocaleDateString()}\n`;
        availableFields.push('dob');
      } else {
        missingInfo.push('Date of Birth');
      }

      if (profileData.personalInfo.email) {
        formSummary += `**Email**: ${profileData.personalInfo.email}\n`;
        availableFields.push('email');
      } else {
        missingInfo.push('Email');
      }

      if (profileData.personalInfo.phone) {
        formSummary += `**Phone**: ${profileData.personalInfo.phone}\n`;
        availableFields.push('phone');
      } else {
        missingInfo.push('Phone Number');
      }

      if (profileData.personalInfo.address) {
        const addr = profileData.personalInfo.address;
        if (addr.street) {
          formSummary += `**Address**: ${addr.street}`;
          if (addr.city && addr.state && addr.zipCode) {
            formSummary += `, ${addr.city}, ${addr.state} ${addr.zipCode}`;
          }
          formSummary += '\n';
          availableFields.push('address');
        }
      } else {
        missingInfo.push('Address');
      }

      if (profileData.insuranceInfo.provider) {
        formSummary += `\n**Insurance Provider**: ${profileData.insuranceInfo.provider}\n`;
        if (profileData.insuranceInfo.memberId) {
          formSummary += `**Member ID**: ${profileData.insuranceInfo.memberId}\n`;
        }
        availableFields.push('insurance');
      }

      if (profileData.emergencyContact?.name) {
        formSummary += `\n**Emergency Contact**: ${profileData.emergencyContact.name}`;
        if (profileData.emergencyContact.phone) {
          formSummary += ` (${profileData.emergencyContact.phone})`;
        }
        formSummary += '\n';
        availableFields.push('emergency');
      }

      if (missingInfo.length > 0) {
        formSummary += `\n**Missing Information**: ${missingInfo.join(', ')}\n`;
        formSummary += "\nWould you like me to help you add this information to your profile?";
        setAwaitingProfileDataConfirmation(true);
      } else {
        formSummary += "\nYou can copy this information to fill out your form. Is there anything specific you'd like to update?";
      }

      setMessages(prev => [...prev, {
        type: 'assistant',
        message: formSummary
      }]);

      setFormFields(availableFields);
      setMissingFields(missingInfo);
      setIsFormFillingMode(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setMessages(prev => [...prev, {
        type: 'assistant',
        message: "I'm sorry, I had trouble accessing your profile data. Please make sure your profile is set up in the Medical Profile section."
      }]);
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

      const userId = '00000000-0000-0000-0000-000000000000';
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
      const userId = '00000000-0000-0000-0000-000000000000';
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

      const insertData = {
        user_id: '00000000-0000-0000-0000-000000000000', // Demo UUID
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
      className={`h-full border-l flex flex-col w-full ${
        darkMode
          ? 'border-stone-800 bg-white'
          : 'border-stone-200 bg-white'
      }`}
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
          <div className="p-6 border-b flex-shrink-0 border-stone-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-stone-100">
                <MessageCircle className="w-5 h-5 text-stone-700" />
              </div>
              <h2 className="text-lg font-semibold text-stone-900">
                Health Assistant
              </h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-white">
            {showInsuranceFlow ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={handleInsuranceBack}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode ? 'hover:bg-stone-800' : 'hover:bg-stone-100'
                    }`}
                  >
                    <ArrowLeft className={`w-5 h-5 ${
                      darkMode ? 'text-stone-400' : 'text-stone-600'
                    }`} />
                  </button>
                  <h3 className={`text-lg font-semibold ${
                    darkMode ? 'text-white' : 'text-stone-900'
                  }`}>
                    {insuranceStep === 'picker' ? 'Select Insurance Provider' : `Connect ${selectedProvider?.name}`}
                  </h3>
                </div>

                {insuranceStep === 'picker' && (
                  <>
                    <div className={`relative mb-4 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                        darkMode ? 'text-stone-500' : 'text-stone-400'
                      }`} />
                      <input
                        type="text"
                        placeholder="Search providers..."
                        value={providerSearchQuery}
                        onChange={(e) => setProviderSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                          darkMode
                            ? 'bg-stone-800 border-stone-700 text-white placeholder-stone-500'
                            : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400'
                        }`}
                      />
                    </div>

                    {loadingProviders ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                      </div>
                    ) : (
                      <>
                        {providers.filter(p => p.isPopular && (!providerSearchQuery || p.name.toLowerCase().includes(providerSearchQuery.toLowerCase()))).length > 0 && (
                          <div className="mb-6">
                            <h4 className={`text-sm font-medium mb-3 ${
                              darkMode ? 'text-stone-400' : 'text-stone-600'
                            }`}>
                              Popular Providers
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {providers
                                .filter(p => p.isPopular && (!providerSearchQuery || p.name.toLowerCase().includes(providerSearchQuery.toLowerCase())))
                                .map((provider) => (
                                  <button
                                    key={provider.id}
                                    onClick={() => handleSelectProvider(provider)}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                                      darkMode
                                        ? 'border-stone-700 hover:bg-stone-800 hover:border-indigo-600'
                                        : 'border-stone-200 hover:bg-stone-50 hover:border-indigo-600'
                                    }`}
                                  >
                                    {provider.logoUrl && (
                                      <img
                                        src={provider.logoUrl}
                                        alt={provider.name}
                                        className="w-8 h-8 rounded"
                                      />
                                    )}
                                    <span className={`text-sm font-medium ${
                                      darkMode ? 'text-white' : 'text-stone-900'
                                    }`}>
                                      {provider.name}
                                    </span>
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}

                        {providers.filter(p => !p.isPopular && (!providerSearchQuery || p.name.toLowerCase().includes(providerSearchQuery.toLowerCase()))).length > 0 && (
                          <div>
                            <h4 className={`text-sm font-medium mb-3 ${
                              darkMode ? 'text-stone-400' : 'text-stone-600'
                            }`}>
                              All Providers
                            </h4>
                            <div className="space-y-2">
                              {providers
                                .filter(p => !p.isPopular && (!providerSearchQuery || p.name.toLowerCase().includes(providerSearchQuery.toLowerCase())))
                                .map((provider) => (
                                  <button
                                    key={provider.id}
                                    onClick={() => handleSelectProvider(provider)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                                      darkMode
                                        ? 'border-stone-700 hover:bg-stone-800'
                                        : 'border-stone-200 hover:bg-stone-50'
                                    }`}
                                  >
                                    {provider.logoUrl && (
                                      <img
                                        src={provider.logoUrl}
                                        alt={provider.name}
                                        className="w-8 h-8 rounded"
                                      />
                                    )}
                                    <span className={`font-medium ${
                                      darkMode ? 'text-white' : 'text-stone-900'
                                    }`}>
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
                    <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
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

                    <div className={`rounded-lg border p-6 ${
                      darkMode ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-200'
                    }`}>
                      <h4 className={`text-sm font-semibold mb-4 ${
                        darkMode ? 'text-white' : 'text-stone-900'
                      }`}>
                        Coverage Summary
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className={`text-xs font-medium ${
                            darkMode ? 'text-stone-400' : 'text-stone-500'
                          }`}>
                            Provider
                          </label>
                          <p className={`text-sm mt-1 ${
                            darkMode ? 'text-white' : 'text-stone-900'
                          }`}>
                            {selectedProvider.name}
                          </p>
                        </div>
                        <div>
                          <label className={`text-xs font-medium ${
                            darkMode ? 'text-stone-400' : 'text-stone-500'
                          }`}>
                            Plan Name
                          </label>
                          <p className={`text-sm mt-1 ${
                            darkMode ? 'text-white' : 'text-stone-900'
                          }`}>
                            {submittedCoverage.planName}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`text-xs font-medium ${
                              darkMode ? 'text-stone-400' : 'text-stone-500'
                            }`}>
                              Member ID
                            </label>
                            <p className={`text-sm mt-1 font-mono ${
                              darkMode ? 'text-white' : 'text-stone-900'
                            }`}>
                              {submittedCoverage.memberId}
                            </p>
                          </div>
                          {submittedCoverage.groupNumber && (
                            <div>
                              <label className={`text-xs font-medium ${
                                darkMode ? 'text-stone-400' : 'text-stone-500'
                              }`}>
                                Group Number
                              </label>
                              <p className={`text-sm mt-1 font-mono ${
                                darkMode ? 'text-white' : 'text-stone-900'
                              }`}>
                                {submittedCoverage.groupNumber}
                              </p>
                            </div>
                          )}
                        </div>
                        {(submittedCoverage.bin || submittedCoverage.pcn) && (
                          <div className="grid grid-cols-2 gap-4">
                            {submittedCoverage.bin && (
                              <div>
                                <label className={`text-xs font-medium ${
                                  darkMode ? 'text-stone-400' : 'text-stone-500'
                                }`}>
                                  BIN
                                </label>
                                <p className={`text-sm mt-1 font-mono ${
                                  darkMode ? 'text-white' : 'text-stone-900'
                                }`}>
                                  {submittedCoverage.bin}
                                </p>
                              </div>
                            )}
                            {submittedCoverage.pcn && (
                              <div>
                                <label className={`text-xs font-medium ${
                                  darkMode ? 'text-stone-400' : 'text-stone-500'
                                }`}>
                                  PCN
                                </label>
                                <p className={`text-sm mt-1 font-mono ${
                                  darkMode ? 'text-white' : 'text-stone-900'
                                }`}>
                                  {submittedCoverage.pcn}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`text-xs font-medium ${
                              darkMode ? 'text-stone-400' : 'text-stone-500'
                            }`}>
                              Relationship
                            </label>
                            <p className={`text-sm mt-1 capitalize ${
                              darkMode ? 'text-white' : 'text-stone-900'
                            }`}>
                              {submittedCoverage.relationship}
                            </p>
                          </div>
                          <div>
                            <label className={`text-xs font-medium ${
                              darkMode ? 'text-stone-400' : 'text-stone-500'
                            }`}>
                              Effective Start
                            </label>
                            <p className={`text-sm mt-1 ${
                              darkMode ? 'text-white' : 'text-stone-900'
                            }`}>
                              {submittedCoverage.effectiveStart ? new Date(submittedCoverage.effectiveStart).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedProvider && (
                      <div className={`rounded-lg border p-6 ${
                        darkMode ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-200'
                      }`}>
                        <h4 className={`text-sm font-semibold mb-4 ${
                          darkMode ? 'text-white' : 'text-stone-900'
                        }`}>
                          Provider Contact Information
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div>
                            <label className={`text-xs font-medium ${
                              darkMode ? 'text-stone-400' : 'text-stone-500'
                            }`}>
                              Customer Service
                            </label>
                            <p className={`mt-1 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                              Available Monday - Friday, 8:00 AM - 8:00 PM EST
                            </p>
                          </div>
                          <div>
                            <label className={`text-xs font-medium ${
                              darkMode ? 'text-stone-400' : 'text-stone-500'
                            }`}>
                              Phone
                            </label>
                            <a href="tel:1-800-555-0100" className="block mt-1 text-indigo-600 hover:text-indigo-700">
                              1-800-555-0100
                            </a>
                          </div>
                          <div>
                            <label className={`text-xs font-medium ${
                              darkMode ? 'text-stone-400' : 'text-stone-500'
                            }`}>
                              Website
                            </label>
                            <a
                              href={`https://www.${selectedProvider.slug || selectedProvider.name.toLowerCase().replace(/\s+/g, '')}.com`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block mt-1 text-indigo-600 hover:text-indigo-700"
                            >
                              View Member Portal
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleInsuranceComplete}
                      className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
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
                    <div className="bg-stone-50 rounded-2xl p-6">
                      <p className="text-base leading-relaxed text-stone-900">
                        Hello! I'm your AI health assistant. I can help you manage your health records, schedule appointments, track vitals, and answer medical questions.
                      </p>
                      <p className="text-sm text-stone-500 mt-2">Just now</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-stone-400" />
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                          Suggestions
                        </h3>
                      </div>
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickAction(suggestion)}
                          className="w-full text-left px-5 py-3.5 rounded-xl bg-white border border-stone-200 text-stone-700 text-sm hover:bg-stone-50 hover:border-stone-300 transition-all"
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
                          <div className="bg-stone-50 rounded-2xl px-5 py-4 max-w-[85%]">
                            <p className="text-sm leading-relaxed text-stone-900 whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        )}
                        {msg.type === 'user' && (
                          <div className="bg-stone-900 rounded-2xl px-5 py-4 max-w-[85%]">
                            <p className="text-sm text-white leading-relaxed">{msg.message}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-stone-50 rounded-2xl px-5 py-4">
                          <Loader2 className="w-4 h-4 animate-spin text-stone-600" />
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
            <div className="p-6 border-t flex-shrink-0 border-stone-200 bg-white">
              <div className="flex gap-3 items-end">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask your health assistant anything..."
                  disabled={isLoading}
                  className={`flex-1 px-4 py-3.5 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent bg-white text-stone-900 placeholder:text-stone-400 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading}
                  className={`flex items-center justify-center w-12 h-12 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all flex-shrink-0 hover:scale-105 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
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
