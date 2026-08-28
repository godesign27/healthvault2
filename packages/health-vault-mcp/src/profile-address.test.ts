import assert from "node:assert/strict";
import test from "node:test";

import {
  formatProfileAddress,
  previewProfileAddressUpdate,
  updateProfileAddress,
} from "./profile-address.ts";

test("legacy full-address street rows render without a duplicated locality", () => {
  assert.equal(
    formatProfileAddress({
      addressLine1: "201 Yerba Buena Ave, Los Altos CA 94022",
      city: "Los Altos",
      state: "CA",
      postalCode: "94022-2275",
    }),
    "201 Yerba Buena Ave, Los Altos, CA 94022-2275",
  );
});

test("address preview keeps a unit and produces normalized replacement fields", () => {
  assert.deepEqual(
    previewProfileAddressUpdate({
      addressLine1: "500 New Street",
      addressLine2: "Apt 4B",
      city: "Denver",
      state: "CO",
      postalCode: "80202",
    }),
    {
      addressLine1: "500 New Street",
      addressLine2: "Apt 4B",
      city: "Denver",
      state: "CO",
      postalCode: "80202",
      formattedAddress: "500 New Street, Apt 4B, Denver, CO 80202",
      requiresConfirmation: true,
    },
  );
});

test("confirmed address update replaces every normalized address column for the authenticated user", async () => {
  let updated: Record<string, unknown> | undefined;
  let matchedUser: string | undefined;
  const row = {
    address_line1: "500 New Street",
    address_line2: null,
    city: "Denver",
    state: "CO",
    postal_code: "80202",
  };
  const query = {
    update(value: Record<string, unknown>) { updated = value; return query; },
    eq(_column: string, value: string) { matchedUser = value; return query; },
    select() { return query; },
    async maybeSingle() { return { data: row, error: null }; },
  };
  const supabase = { from: () => query };

  const saved = await updateProfileAddress(supabase as never, "user-1", {
    addressLine1: "500 New Street, Denver CO 80202",
    city: "Denver",
    state: "CO",
    postalCode: "80202",
  });

  assert.equal(matchedUser, "user-1");
  assert.equal(updated?.address_line1, "500 New Street");
  assert.equal(updated?.address_line2, null);
  assert.equal(updated?.city, "Denver");
  assert.equal(updated?.state, "CO");
  assert.equal(updated?.postal_code, "80202");
  assert.deepEqual(saved, row);
});
