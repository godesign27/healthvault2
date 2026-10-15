import {supabase} from '../supabase';
import {loadFormAutofillContext as load} from '../../../packages/forms/autopopulate';
export * from '../../../packages/forms/autopopulate';
export const loadFormAutofillContext=(userId:string)=>load(userId,supabase);
