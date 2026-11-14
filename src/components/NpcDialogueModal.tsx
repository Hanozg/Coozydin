import { Coffee, Footprints, IceCreamCone, MessageCircle, Sparkles, UtensilsCrossed, X } from 'lucide-react';
import { BuildingNpcDef, NpcActionOption } from '../types/game';

interface NpcDialogueModalProps {
  npc: BuildingNpcDef;
  coins: number;
  isFirstChat: boolean;
  onSelectAction: (npc: BuildingNpcDef, action: NpcActionOption) => void;
  onClose: () => void;
}

function ActionIcon({ treat }: { treat: NpcActionOption['treat'] }) {
  if (treat === 'icecream') return <IceCreamCone className="w-4 h-4 shrink-0" aria-hidden="true" />;
  if (treat === 'coffee') return <Coffee className="w-4 h-4 shrink-0" aria-hidden="true" />;
  if (treat === 'simit' || treat === 'kumpir' || treat === 'keskek') {
    return <UtensilsCrossed className="w-4 h-4 shrink-0" aria-hidden="true" />;
  }
  return <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />;
}

function NpcAvatarPortrait({ npc }: { npc: BuildingNpcDef }) {
  const skin = npc.skinColor || '#E8BC98';
  const hair = npc.hairColor || '#3B281E';
  const hat = npc.hatColor || '#485464';
  const shirt = npc.shirtColor || '#3B5978';
  const hairStyle =
    npc.hairStyle ?? (npc.hatStyle === 'headscarf' ? 'bun' : 'short');

  return (
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#FAF2E2] border-2 border-[#B99464] shadow-sm overflow-hidden shrink-0 flex items-center justify-center">
      <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
        <rect width="64" height="64" fill="#F2E4C8" />
        {/* Shoulders & Shirt + Cream Inner Collar */}
        <path d="M10 64 C11 50, 20 46, 32 46 C44 46, 53 50, 54 64 Z" fill={shirt} />
        <path d="M24 47 L32 56 L40 47 Z" fill="#F5EDE0" />
        {/* Neck */}
        <rect x="27.5" y="39" width="9" height="10" rx="4" fill={skin} />

        {/* Long / Bob / Bun Back Hair */}
        {npc.hatStyle !== 'headscarf' && hairStyle === 'waves' && (
          <path d="M16 28 C14 40, 16 48, 22 50 L42 50 C48 48, 50 40, 48 28 Z" fill={hair} />
        )}
        {npc.hatStyle !== 'headscarf' && hairStyle === 'bob' && (
          <path d="M17 27 C16 36, 18 42, 23 44 L41 44 C46 42, 48 36, 47 27 Z" fill={hair} />
        )}
        {npc.hatStyle !== 'headscarf' && hairStyle === 'bun' && (
          <circle cx="32" cy="12" r="7.5" fill={hair} />
        )}

        {/* Headscarf Backdrop */}
        {npc.hatStyle === 'headscarf' && (
          <path
            d="M15 32 C14 17, 22 10, 32 10 C42 10, 50 17, 49 32 L51 54 C44 58, 20 58, 13 54 Z"
            fill={hat}
            stroke="#C7B293"
            strokeWidth="1"
          />
        )}

        {/* Ears */}
        <ellipse cx="18.5" cy="29.5" rx="2.6" ry="3.8" fill={skin} />
        <ellipse cx="45.5" cy="29.5" rx="2.6" ry="3.8" fill={skin} />

        {/* Face */}
        <rect x="19" y="15" width="26" height="28" rx="12.5" fill={skin} />

        {/* Rosy Cheeks */}
        <ellipse cx="23.5" cy="31.5" rx="3" ry="1.8" fill="#D97A6C" opacity="0.32" />
        <ellipse cx="40.5" cy="31.5" rx="3" ry="1.8" fill="#D97A6C" opacity="0.32" />

        {/* Expressive Eyes with Sclera, Iris & Catchlight */}
        <ellipse cx="26.5" cy="27.5" rx="2.8" ry="2.2" fill="#FAF6EE" />
        <ellipse cx="37.5" cy="27.5" rx="2.8" ry="2.2" fill="#FAF6EE" />
        <circle cx="26.7" cy="27.6" r="1.5" fill="#3B291F" />
        <circle cx="37.7" cy="27.6" r="1.5" fill="#3B291F" />
        <circle cx="27.3" cy="26.9" r="0.55" fill="#FFFFFF" />
        <circle cx="38.3" cy="26.9" r="0.55" fill="#FFFFFF" />

        {/* Eyebrows */}
        <path d="M23.5 24 Q26.5 22.6 29.3 23.8" fill="none" stroke={hair} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M34.7 23.8 Q37.5 22.6 40.5 24" fill="none" stroke={hair} strokeWidth="1.4" strokeLinecap="round" />

        {/* Glasses */}
        {npc.glasses && (
          <g fill="none" stroke="#3B2C22" strokeWidth="1.25">
            <rect x="22.8" y="24.8" width="7.4" height="5.4" rx="2" fill="#D8ECF2" fillOpacity="0.24" />
            <rect x="33.8" y="24.8" width="7.4" height="5.4" rx="2" fill="#D8ECF2" fillOpacity="0.24" />
            <line x1="30.2" y1="27.3" x2="33.8" y2="27.3" />
          </g>
        )}

        {/* Nose */}
        <path d="M32 27.5 L32 32.5 Q30.5 33.4 29.6 32.6" fill="none" stroke="#B6805B" strokeWidth="1.2" strokeLinecap="round" />

        {/* Smile */}
        <path d="M28 36 Q32 38.8 36 36" fill="none" stroke="#A85549" strokeWidth="1.5" strokeLinecap="round" />

        {/* Facial Hair */}
        {npc.facialHair === 'full_beard' && (
          <path d="M20 33 C20 43, 25 46.5, 32 46.5 C39 46.5, 44 43, 44 33 C40 35.5, 36 36.5, 32 36.5 C28 36.5, 24 35.5, 20 33 Z" fill={hair} />
        )}
        {(npc.facialHair === 'mustache' || npc.facialHair === 'goatee' || npc.facialHair === 'full_beard') && (
          <path d="M26.5 35 Q32 33 37.5 35 Q35 36.8 32 35.8 Q29 36.8 26.5 35 Z" fill={hair} />
        )}
        {npc.facialHair === 'goatee' && (
          <ellipse cx="32" cy="41.5" rx="3.5" ry="2.6" fill={hair} />
        )}

        {/* Top Hair */}
        {npc.hatStyle !== 'headscarf' && (
          <path
            d="M18.5 24 C18.5 15, 24 12, 32 12 C40 12, 45.5 15, 45.5 24 C42.5 19.5, 37.5 18.5, 32 19 C26.5 18.5, 21.5 19.5, 18.5 24 Z"
            fill={hair}
          />
        )}

        {/* Hats */}
        {npc.hatStyle === 'cap' && (
          <g>
            <path d="M18 20 C19 12, 25 10, 32 10 C39 10, 45 12, 46 20 Z" fill={hat} />
            <path d="M18 19.5 Q32 22.5 48 20.5 Q40 17.5 18 19.5 Z" fill={hat} opacity="0.85" />
          </g>
        )}
        {npc.hatStyle === 'chef' && (
          <g>
            <path d="M21 17 C18 11, 23 6, 28 8 C30 5, 34 5, 36 8 C41 6, 46 11, 43 17 Z" fill={hat} stroke="#D4C7B0" strokeWidth="0.9" />
            <rect x="21" y="15.5" width="22" height="4.5" rx="1.5" fill={hat} stroke="#D4C7B0" strokeWidth="0.8" />
          </g>
        )}
      </svg>
    </div>
  );
}

export function NpcDialogueModal({
  npc,
  coins,
  isFirstChat,
  onSelectAction,
  onClose,
}: NpcDialogueModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#2A1D12]/55 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-lg max-h-[92dvh] overflow-y-auto efeler-scroll rounded-2xl bg-[#FBF4E4] border-2 border-[#B99464] text-[#3A2618] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 bg-[#EFE1C4] border-b border-[#B99464]/50">
          <div className="flex items-center gap-3 min-w-0">
            <NpcAvatarPortrait npc={npc} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B84C27]">
                  <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  {npc.buildingName}
                </span>
                {isFirstChat && (
                  <span className="px-2 py-0.5 rounded-md bg-[#5D8A48] text-[#FAF2E2] text-[10px] font-bold">
                    Tanışma Bonusu +5 İncir
                  </span>
                )}
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#3A2618] mt-1">
                {npc.name}
              </h2>
              <p className="text-xs font-medium text-[#6B5038]">{npc.role}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Sohbeti Kapat"
            className="p-1.5 rounded-xl bg-[#FBF4E4] hover:bg-[#E5D3B1] border border-[#B99464]/50 text-[#3A2618] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-[#F4E9D2] border border-[#B99464]/45 p-3.5 text-sm leading-relaxed text-[#3A2618]">
            “{npc.greeting}”
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-[#6B5038]">
            <span>İkramlar &amp; Etkinlikler</span>
            <span className="font-mono-num text-[#B84C27]">Mevcut Puanın: {coins} İncir</span>
          </div>

          <div className="space-y-2.5">
            {npc.actions.map((action) => {
              const affordable = coins >= action.cost;
              return (
                <button
                  key={action.id}
                  type="button"
                  disabled={!affordable}
                  onClick={() => onSelectAction(npc, action)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 text-left transition-colors ${
                    affordable
                      ? action.startsWalk
                        ? 'bg-[#5D8A48] hover:bg-[#4F783C] border-[#426632] text-[#FAF2E2] cursor-pointer'
                        : 'bg-[#C85A32] hover:bg-[#B34D28] border-[#9E4120] text-[#FAF2E2] cursor-pointer'
                      : 'bg-[#EDE0C6]/75 border-[#B99464]/40 text-[#8A735D] cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ActionIcon treat={action.treat} />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold leading-snug">
                        {action.label}
                      </div>
                      {action.startsWalk && (
                        <div className="flex items-center gap-1 text-[11px] opacity-90 mt-0.5">
                          <Footprints className="w-3 h-3" aria-hidden="true" />
                          <span>Yürüyüş moduna geçer ve yanında yürür</span>
                        </div>
                      )}
                      {!affordable && (
                        <div className="text-[11px] text-[#9E4120] font-semibold mt-0.5">
                          Yetersiz İncir Puanı ({action.cost} İncir gerekli)
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="font-mono-num text-xs font-bold px-2.5 py-1 rounded-lg bg-black/15 shrink-0">
                    {action.cost} İncir
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#EDE0C6] hover:bg-[#E1CFAF] border border-[#B99464]/60 text-xs font-semibold text-[#3A2618] transition-colors cursor-pointer"
            >
              Sohbeti Bitir &amp; Devam Et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
