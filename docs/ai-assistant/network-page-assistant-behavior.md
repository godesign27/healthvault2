# Network Page — Assistant Behavior Examples

## Insurance Connected

**User:** "Help me find a doctor"
**Assistant behavior:**
1. Calls `getConnectedInsurance` → finds active Aetna PPO plan.
2. Calls `searchInNetworkProviders` → returns saved providers with in-network annotations.
3. Response: "I found your Aetna PPO coverage. You have 2 in-network providers saved. Would you like to search for a specific specialty, or add a new provider to your network?"

---

**User:** "Find me a cardiologist"
**Assistant behavior:**
1. Calls `searchInNetworkProviders` with `specialty: "Cardiology"`.
2. Response: "I found Dr. Mina Cho (Cardiology) at Heart & Vascular Institute in your network. She's currently marked as out of network. Would you like to add another cardiologist or update her network status?"

---

## No Insurance Connected

**User:** "Show me in-network doctors"
**Assistant behavior:**
1. Calls `getConnectedInsurance` → returns empty.
2. Response: "You don't have any active insurance connected to Health Vault yet. I can still show your saved providers, but I can't verify in-network status without insurance information. Would you like to see your care network or add insurance first?"

---

## Pharmacy Flow

**User:** "Find a pharmacy near me"
**Assistant behavior (address on file):**
1. Calls `getNearbyPharmacies`.
2. Response: "Based on your address in Springfield, IL, here are your saved pharmacies: Lakeside Pharmacy (preferred, delivery available). Would you like to search for more pharmacies or change your preferred one?"

**Assistant behavior (no address):**
1. Calls `getNearbyPharmacies` → addressContext is null.
2. Response: "I need your address to find nearby pharmacies. You can update your address in your profile settings. In the meantime, I can show your saved pharmacies if you have any."

---

**User:** "Make Walgreens my preferred pharmacy"
**Assistant behavior:**
1. Calls `getNearbyPharmacies` to find the Walgreens pharmacy ID.
2. Calls `setPreferredPharmacy` with the ID.
3. Response: "Done! Walgreens is now set as your preferred pharmacy."

---

## Care Network Summary

**User:** "Who are my doctors?"
**Assistant behavior:**
1. Calls `getCareNetwork`.
2. Response: "Here's your care network: **Primary Care:** Dr. Alex Rivera (Family Medicine, Riverside Medical Center). **Specialists:** Dr. Mina Cho (Cardiology). **Preferred Pharmacy:** Lakeside Pharmacy. Would you like to add another provider or update anything?"

---

## Adding a Provider

**User:** "Add Dr. Smith as my dentist"
**Assistant behavior:**
1. Calls `saveProviderToNetwork` with `name: "Dr. Smith"`, `relationship: "Dental"`.
2. Response: "I've added Dr. Smith to your care network as a dental provider. Would you like to add their phone number, address, or any other details?"

---

## Empty Network State

**User opens Network page for the first time:**
**Assistant behavior:**
1. Calls `getConnectedInsurance` → empty.
2. Calls `getCareNetwork` → empty.
3. Response: "Your care network is empty. I can help you get started: 1) Connect your insurance to enable in-network provider search. 2) Add your primary care doctor. 3) Set a preferred pharmacy. What would you like to do first?"
