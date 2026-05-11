import { useState } from 'react';
import { Mic, MessageCircle } from 'lucide-react';
import { VoiceInteraction } from './VoiceInteraction';
import { getVoiceMessageForContext, type PageContext } from '../lib/voice/context-messages';

interface FloatingChatActionsProps {
  onOpenChat: () => void;
  darkMode?: boolean;
  context?: PageContext;
}

export function FloatingChatActions({ onOpenChat, darkMode = false, context = 'dashboard' }: FloatingChatActionsProps) {
  const [showVoice, setShowVoice] = useState(false);
  const [isHoveringGroup, setIsHoveringGroup] = useState(false);

  const voiceMessage = getVoiceMessageForContext(context);

  return (
    <>
      {/* Floating Action Button Group */}
      <div
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 lg:z-40"
        onMouseEnter={() => setIsHoveringGroup(true)}
        onMouseLeave={() => setIsHoveringGroup(false)}
      >
        {/*
          Visual Grouping Container
          - Semi-transparent background creates visual unity between related elements
          - Rounded corners and padding establish clear boundaries
          - Subtle shadow adds depth and hierarchy
          - Transition ensures smooth state changes
        */}
        <div className={`
          relative flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2
          bg-surface-raised/95 backdrop-blur-sm
          rounded-full
          shadow-2xl shadow-black/40
          transition-all duration-300 ease-out
          ${isHoveringGroup ? 'bg-surface-page shadow-2xl shadow-black/50 scale-[1.02]' : ''}
        `}>

          {/* Talk Button - Primary Action with Eye-Catching Gradient */}
          <button
            onClick={() => setShowVoice(true)}
            className={`
              group
              relative flex items-center gap-2 sm:gap-3 p-3 sm:px-6 sm:py-3
              text-white
              rounded-full
              shadow-lg shadow-orange-500/30
              overflow-hidden
              transition-all duration-300 ease-out
              hover:shadow-xl hover:shadow-orange-500/40
              hover:scale-105
              active:scale-95
            `}
            style={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.85) 0%, rgba(249, 115, 22, 0.85) 35%, rgba(251, 146, 60, 0.85) 65%, rgba(168, 85, 247, 0.85) 100%)',
            }}
            aria-label="Start voice interaction"
          >
            {/* Animated Gradient Overlay - Creates depth and movement */}
            <div
              className="
                absolute inset-0
                opacity-0
                group-hover:opacity-100
                transition-opacity duration-500 ease-out
              "
              style={{
                background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.9) 0%, rgba(168, 85, 247, 0.9) 50%, rgba(236, 72, 153, 0.9) 100%)',
              }}
            />

            {/* Shimmer Effect - Adds subtle shine on hover */}
            <div className="
              absolute inset-0
              bg-gradient-to-r from-transparent via-white/20 to-transparent
              translate-x-[-100%]
              group-hover:translate-x-[100%]
              transition-transform duration-700 ease-out
            " />

            {/* Glow Border Effect */}
            <div
              className="
                absolute inset-0 rounded-full
                opacity-0 group-hover:opacity-100
                transition-opacity duration-300
              "
              style={{
                boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.3), 0 0 30px rgba(249, 115, 22, 0.4)',
              }}
            />

            {/* Icon with smooth scale transition */}
            <Mic className="
              w-5 h-5
              relative z-20
              transition-transform duration-300
              group-hover:scale-110
              drop-shadow-lg
            " />

            {/* Text label — hidden on mobile, visible on sm+ */}
            <span className="
              hidden sm:inline
              font-semibold text-base
              relative z-20
              drop-shadow-lg
            ">
              Talk
            </span>
          </button>

          {/* Chat Button - Secondary Action */}
          <button
            onClick={onOpenChat}
            className={`
              group
              relative flex items-center justify-center
              w-11 h-11 sm:w-14 sm:h-14
              bg-white text-content-primary
              rounded-full
              border-2 border-white/20
              shadow-lg shadow-black/20
              overflow-hidden
              transition-all duration-300 ease-out
              hover:bg-surface-sunken
              hover:border-orange-300
              hover:shadow-xl hover:shadow-orange-400/30
              hover:scale-105
              active:scale-95
            `}
            aria-label="Open chat"
          >
            {/* Hover Effect Background */}
            <div className="
              absolute inset-0
              bg-gradient-to-br from-orange-50/70 via-pink-50/50 to-purple-50/70
              opacity-0
              group-hover:opacity-100
              transition-opacity duration-300
            " />

            {/* Icon with smooth rotation on hover */}
            <MessageCircle className="
              w-5 h-5 sm:w-6 sm:h-6
              relative z-10
              transition-transform duration-300
              group-hover:rotate-12
              group-hover:scale-110
            " />
          </button>
        </div>
      </div>

      {/* Voice Interaction Modal */}
      {showVoice && (
        <VoiceInteraction
          message={voiceMessage}
          onClose={() => setShowVoice(false)}
          onOpenChat={() => {
            setShowVoice(false);
            onOpenChat();
          }}
          darkMode={darkMode}
        />
      )}
    </>
  );
}
