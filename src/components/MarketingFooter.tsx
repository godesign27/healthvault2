import { Heart } from 'lucide-react';

interface MarketingFooterProps {
  darkMode?: boolean;
  onPageChange?: (page: string) => void;
}

export function MarketingFooter({ darkMode = false, onPageChange }: MarketingFooterProps) {
  return (
    <footer className={`border-t ${
      darkMode
        ? 'border-stroke-subtle bg-surface-page'
        : 'border-stroke-subtle bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-lg">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className={`text-lg font-bold ${
                darkMode ? 'text-white' : 'text-content-primary'
              }`}>Health Vault</span>
            </div>
            <p className={`text-sm leading-relaxed mb-6 ${
              darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`}>
              Health Vault is a decentralized health data platform that gives you control, and share their medical wellness data with those they trust.
            </p>
            <p className={`text-sm font-semibold mb-2 ${
              darkMode ? 'text-white' : 'text-content-primary'
            }`}>Founder Bio</p>
            <p className={`text-sm leading-relaxed mb-2 ${
              darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`}>
              <span className={`font-semibold ${
                darkMode ? 'text-white' : 'text-content-primary'
              }`}>Timothy McGuire, Founder & CEO</span>
            </p>
            <p className={`text-sm leading-relaxed ${
              darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`}>
              Timothy is a digital product designer and entrepreneur passionate about creating innovative experiences leading UX design for Fortune 500 brands. His vision for Health Vault is to create a secure, interoperable, and user-owned—paving the way for AI-driven predictive health and personalized, community-powered insights.
            </p>
          </div>

          <div>
            <h3 className={`text-sm font-semibold mb-4 ${
              darkMode ? 'text-white' : 'text-content-primary'
            }`}>Media Inquiries</h3>
            <a href="mailto:team@healthvault.me" className={`text-sm transition-colors ${
              darkMode
                ? 'text-indigo-400 hover:text-indigo-300'
                : 'text-indigo-600 hover:text-indigo-700'
            }`}>
              team@healthvault.me
            </a>

            <h3 className={`text-sm font-semibold mt-8 mb-4 ${
              darkMode ? 'text-white' : 'text-content-primary'
            }`}>Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => onPageChange?.('home')}
                  className={`text-sm transition-colors ${
                    darkMode
                      ? 'text-content-secondary hover:text-white'
                      : 'text-content-secondary hover:text-content-primary'
                  }`}>
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onPageChange?.('whitepaper')}
                  className={`text-sm transition-colors ${
                    darkMode
                      ? 'text-content-secondary hover:text-white'
                      : 'text-content-secondary hover:text-content-primary'
                  }`}>
                  Personal Health Vault
                </button>
              </li>
              <li>
                <a href="#buy" className={`text-sm transition-colors ${
                  darkMode
                    ? 'text-content-secondary hover:text-white'
                    : 'text-content-secondary hover:text-content-primary'
                }`}>
                  Login
                </a>
              </li>
              <li>
                <a href="#press" className={`text-sm transition-colors ${
                  darkMode
                    ? 'text-content-secondary hover:text-white'
                    : 'text-content-secondary hover:text-content-primary'
                }`}>
                  Press
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={`text-sm font-semibold mb-4 ${
              darkMode ? 'text-white' : 'text-content-primary'
            }`}>Legal</h3>
            <ul className="space-y-3">
              <li>
                <a href="#privacy" className={`text-sm transition-colors ${
                  darkMode
                    ? 'text-content-secondary hover:text-white'
                    : 'text-content-secondary hover:text-content-primary'
                }`}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#disclaimer" className={`text-sm transition-colors ${
                  darkMode
                    ? 'text-content-secondary hover:text-white'
                    : 'text-content-secondary hover:text-content-primary'
                }`}>
                  Disclaimer
                </a>
              </li>
              <li>
                <a href="#terms" className={`text-sm transition-colors ${
                  darkMode
                    ? 'text-content-secondary hover:text-white'
                    : 'text-content-secondary hover:text-content-primary'
                }`}>
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={`pt-8 border-t ${
          darkMode ? 'border-stroke-subtle' : 'border-stroke-subtle'
        }`}>
          <p className={`text-sm text-center ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`}>
            © 2025 Health Vault. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
