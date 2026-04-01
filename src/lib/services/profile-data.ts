import { supabase } from '../supabase';

export interface UserProfileData {
  personalInfo: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    dateOfBirth?: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
  medicalInfo: {
    conditions?: Array<{ name: string; diagnosedDate?: string }>;
    medications?: Array<{ name: string; dosage?: string }>;
    allergies?: Array<{ allergen: string; severity?: string }>;
    bloodType?: string;
    height?: string;
    weight?: string;
  };
  insuranceInfo: {
    provider?: string;
    memberId?: string;
    groupNumber?: string;
    planName?: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
}

export async function fetchUserProfileData(userId: string): Promise<UserProfileData> {
  const profileData: UserProfileData = {
    personalInfo: {},
    medicalInfo: {},
    insuranceInfo: {},
  };

  try {
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (userProfile) {
      profileData.personalInfo = {
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        fullName: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim(),
        dateOfBirth: userProfile.date_of_birth,
        email: userProfile.email,
        phone: userProfile.phone,
        address: userProfile.address ? {
          street: userProfile.address.street,
          city: userProfile.address.city,
          state: userProfile.address.state,
          zipCode: userProfile.address.zip_code,
          country: userProfile.address.country || 'USA',
        } : undefined,
      };

      if (userProfile.emergency_contact) {
        profileData.emergencyContact = {
          name: userProfile.emergency_contact.name,
          relationship: userProfile.emergency_contact.relationship,
          phone: userProfile.emergency_contact.phone,
        };
      }
    }

    const { data: patientProfile } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (patientProfile) {
      profileData.medicalInfo = {
        conditions: patientProfile.conditions || [],
        medications: patientProfile.medications || [],
        allergies: patientProfile.allergies || [],
        bloodType: patientProfile.blood_type,
        height: patientProfile.height,
        weight: patientProfile.weight,
      };
    }

    const { data: insurance } = await supabase
      .from('insurance_coverages')
      .select('*, insurance_providers!inner(*)')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .maybeSingle();

    if (insurance) {
      profileData.insuranceInfo = {
        provider: insurance.insurance_providers?.name,
        memberId: insurance.member_id_hash,
        groupNumber: insurance.group_number,
        planName: insurance.plan_name,
      };
    }

    return profileData;
  } catch (error) {
    console.error('Error fetching user profile data:', error);
    return profileData;
  }
}

export function analyzeFormFields(formDescription: string): string[] {
  const fields: string[] = [];
  const lowerDesc = formDescription.toLowerCase();

  const fieldMap: { [key: string]: string[] } = {
    'firstName': ['first name', 'given name'],
    'lastName': ['last name', 'surname', 'family name'],
    'fullName': ['full name', 'name', 'patient name'],
    'dateOfBirth': ['date of birth', 'dob', 'birth date', 'birthdate'],
    'email': ['email', 'e-mail', 'email address'],
    'phone': ['phone', 'telephone', 'contact number', 'phone number'],
    'address': ['address', 'street address', 'mailing address'],
    'city': ['city'],
    'state': ['state', 'province'],
    'zipCode': ['zip', 'postal code', 'zip code'],
    'insuranceProvider': ['insurance provider', 'insurance company', 'insurer'],
    'memberId': ['member id', 'member number', 'insurance id'],
    'groupNumber': ['group number', 'group id'],
    'emergencyContact': ['emergency contact', 'emergency contact name'],
    'emergencyPhone': ['emergency contact phone', 'emergency number'],
  };

  for (const [field, keywords] of Object.entries(fieldMap)) {
    if (keywords.some(keyword => lowerDesc.includes(keyword))) {
      fields.push(field);
    }
  }

  return fields;
}

export function getFieldValue(profileData: UserProfileData, fieldName: string): string | undefined {
  switch (fieldName) {
    case 'firstName':
      return profileData.personalInfo.firstName;
    case 'lastName':
      return profileData.personalInfo.lastName;
    case 'fullName':
      return profileData.personalInfo.fullName;
    case 'dateOfBirth':
      return profileData.personalInfo.dateOfBirth;
    case 'email':
      return profileData.personalInfo.email;
    case 'phone':
      return profileData.personalInfo.phone;
    case 'address':
      return profileData.personalInfo.address?.street;
    case 'city':
      return profileData.personalInfo.address?.city;
    case 'state':
      return profileData.personalInfo.address?.state;
    case 'zipCode':
      return profileData.personalInfo.address?.zipCode;
    case 'insuranceProvider':
      return profileData.insuranceInfo.provider;
    case 'memberId':
      return profileData.insuranceInfo.memberId;
    case 'groupNumber':
      return profileData.insuranceInfo.groupNumber;
    case 'emergencyContact':
      return profileData.emergencyContact?.name;
    case 'emergencyPhone':
      return profileData.emergencyContact?.phone;
    default:
      return undefined;
  }
}

export async function updateUserProfile(
  userId: string,
  updates: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    emergencyContact?: {
      name?: string;
      relationship?: string;
      phone?: string;
    };
  }
): Promise<boolean> {
  try {
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const profileUpdate: any = {
      user_id: userId,
      first_name: updates.firstName,
      last_name: updates.lastName,
      date_of_birth: updates.dateOfBirth,
      email: updates.email,
      phone: updates.phone,
    };

    if (updates.address) {
      profileUpdate.address = {
        street: updates.address.street,
        city: updates.address.city,
        state: updates.address.state,
        zip_code: updates.address.zipCode,
        country: updates.address.country || 'USA',
      };
    }

    if (updates.emergencyContact) {
      profileUpdate.emergency_contact = updates.emergencyContact;
    }

    if (existingProfile) {
      const { error } = await supabase
        .from('user_profiles')
        .update(profileUpdate)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_profiles')
        .insert(profileUpdate);

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
}
