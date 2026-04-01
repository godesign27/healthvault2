import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Provider, Pharmacy, InsuranceContext } from '../../types/network';
import { supabase } from '../supabase';

interface NetworkStore {
  providers: Provider[];
  pharmacies: Pharmacy[];
  insurance: InsuranceContext;
  loading: boolean;
  addProvider: (provider: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Provider>;
  updateProvider: (id: string, updates: Partial<Provider>) => Promise<void>;
  removeProvider: (id: string) => Promise<void>;
  addPharmacy: (pharmacy: Omit<Pharmacy, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Pharmacy>;
  updatePharmacy: (id: string, updates: Partial<Pharmacy>) => Promise<void>;
  removePharmacy: (id: string) => Promise<void>;
  loadData: () => Promise<void>;
  inNetworkProviders: () => Provider[];
  outOfNetworkProviders: () => Provider[];
}

const NetworkContext = createContext<NetworkStore | null>(null);

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [insurance, setInsurance] = useState<InsuranceContext>({ connected: false });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [providersRes, pharmaciesRes, insuranceRes] = await Promise.all([
        supabase
          .from('providers')
          .select('*')
          .eq('user_id', DEMO_USER_ID)
          .order('created_at', { ascending: false }),
        supabase
          .from('pharmacies')
          .select('*')
          .eq('user_id', DEMO_USER_ID)
          .order('created_at', { ascending: false }),
        supabase
          .from('insurance_coverages')
          .select('*, provider:insurance_providers(*)')
          .eq('user_id', DEMO_USER_ID)
          .eq('coverage_status', 'active')
          .limit(1)
          .maybeSingle()
      ]);

      if (providersRes.data) {
        setProviders(providersRes.data.map(p => ({
          ...p,
          userId: p.user_id,
          connectionSource: p.connection_source as any,
          lastVisitDate: p.last_visit_date,
          inNetwork: p.in_network,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        })));
      }

      if (pharmaciesRes.data) {
        setPharmacies(pharmaciesRes.data.map(ph => ({
          ...ph,
          userId: ph.user_id,
          deliveryOptions: ph.delivery_options as any,
          inNetwork: ph.in_network,
          createdAt: ph.created_at,
          updatedAt: ph.updated_at
        })));
      }

      if (insuranceRes.data) {
        setInsurance({
          connected: true,
          name: insuranceRes.data.provider?.name,
          planId: insuranceRes.data.id
        });
      }
    } catch (error) {
      console.error('Error loading network data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addProvider = useCallback(async (provider: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('providers')
      .insert({
        user_id: provider.userId || DEMO_USER_ID,
        npi: provider.npi,
        name: provider.name,
        specialty: provider.specialty,
        clinic: provider.clinic,
        phone: provider.phone,
        email: provider.email,
        address: provider.address,
        relationship: provider.relationship,
        connection_source: provider.connectionSource,
        last_visit_date: provider.lastVisitDate,
        in_network: provider.inNetwork,
        notes: provider.notes
      })
      .select()
      .single();

    if (error) throw error;

    const newProvider: Provider = {
      ...data,
      userId: data.user_id,
      connectionSource: data.connection_source as any,
      lastVisitDate: data.last_visit_date,
      inNetwork: data.in_network,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    setProviders(prev => [newProvider, ...prev]);
    return newProvider;
  }, []);

  const updateProvider = useCallback(async (id: string, updates: Partial<Provider>) => {
    const { error } = await supabase
      .from('providers')
      .update({
        name: updates.name,
        specialty: updates.specialty,
        clinic: updates.clinic,
        phone: updates.phone,
        email: updates.email,
        address: updates.address,
        relationship: updates.relationship,
        last_visit_date: updates.lastVisitDate,
        in_network: updates.inNetwork,
        notes: updates.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    setProviders(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
  }, []);

  const removeProvider = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('providers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setProviders(prev => prev.filter(p => p.id !== id));
  }, []);

  const addPharmacy = useCallback(async (pharmacy: Omit<Pharmacy, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('pharmacies')
      .insert({
        user_id: pharmacy.userId || DEMO_USER_ID,
        name: pharmacy.name,
        chain: pharmacy.chain,
        phone: pharmacy.phone,
        address: pharmacy.address,
        preferred: pharmacy.preferred,
        delivery_options: pharmacy.deliveryOptions,
        in_network: pharmacy.inNetwork,
        notes: pharmacy.notes
      })
      .select()
      .single();

    if (error) throw error;

    const newPharmacy: Pharmacy = {
      ...data,
      userId: data.user_id,
      deliveryOptions: data.delivery_options as any,
      inNetwork: data.in_network,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    setPharmacies(prev => [newPharmacy, ...prev]);
    return newPharmacy;
  }, []);

  const updatePharmacy = useCallback(async (id: string, updates: Partial<Pharmacy>) => {
    const { error } = await supabase
      .from('pharmacies')
      .update({
        name: updates.name,
        chain: updates.chain,
        phone: updates.phone,
        address: updates.address,
        preferred: updates.preferred,
        delivery_options: updates.deliveryOptions,
        in_network: updates.inNetwork,
        notes: updates.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    setPharmacies(prev => prev.map(ph => ph.id === id ? { ...ph, ...updates, updatedAt: new Date().toISOString() } : ph));
  }, []);

  const removePharmacy = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('pharmacies')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setPharmacies(prev => prev.filter(ph => ph.id !== id));
  }, []);

  const inNetworkProviders = useCallback(() => {
    return providers.filter(p => p.inNetwork === true);
  }, [providers]);

  const outOfNetworkProviders = useCallback(() => {
    return providers.filter(p => p.inNetwork === false);
  }, [providers]);

  const value: NetworkStore = {
    providers,
    pharmacies,
    insurance,
    loading,
    addProvider,
    updateProvider,
    removeProvider,
    addPharmacy,
    updatePharmacy,
    removePharmacy,
    loadData,
    inNetworkProviders,
    outOfNetworkProviders
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetworkStore() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetworkStore must be used within NetworkProvider');
  }
  return context;
}
