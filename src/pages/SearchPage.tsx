import React from 'react';
import { Search, SearchWithButton, SearchWithDropdown, SearchStacked, SearchIconOnly } from '../components/ui/Search';

export default function SearchPage() {
  return (
    <div className="w-full min-h-0">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-content-primary mb-2">Search</h1>
          <p className="text-content-secondary">
            Search input components with various configurations and styles
          </p>
        </div>

        <div className="space-y-8">
          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Basic Search Components</h2>
            <div className="grid grid-cols-3 gap-6 mb-8">
              <SearchIconOnly size="small" />
              <SearchIconOnly size="medium" />
              <SearchIconOnly size="large" />
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <Search placeholder="Search..." variant="outlined" size="medium" />
                <Search placeholder="Search..." variant="outlined" size="medium" />
                <Search placeholder="Search..." variant="outlined" size="medium" />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <Search placeholder="Search..." variant="outlined" size="medium" showClearButton />
                <Search placeholder="Search..." variant="outlined" size="medium" showClearButton />
                <Search placeholder="Search..." variant="outlined" size="medium" showClearButton />
              </div>

              <div className="space-y-4">
                <SearchWithButton placeholder="Search..." buttonText="Button" />
                <SearchWithButton placeholder="Search..." buttonText="Button" />
                <SearchWithButton placeholder="Search..." buttonText="Button" />
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Search with Dropdown</h2>
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <SearchWithDropdown
                  placeholder="Search..."
                  dropdownOptions={['Select an option', 'Option 1', 'Option 2', 'Option 3']}
                />
                <SearchWithDropdown
                  placeholder="Search..."
                  dropdownOptions={['Select an option', 'Option 1', 'Option 2', 'Option 3']}
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <SearchStacked
                  placeholder="Search..."
                  dropdownOptions={['Select an option', 'Option 1', 'Option 2', 'Option 3']}
                />
                <SearchStacked
                  placeholder="Search..."
                  dropdownOptions={['Select an option', 'Option 1', 'Option 2', 'Option 3']}
                />
                <SearchStacked
                  placeholder="Search..."
                  dropdownOptions={['Select an option', 'Option 1', 'Option 2', 'Option 3']}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
