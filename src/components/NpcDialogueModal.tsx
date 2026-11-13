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

export function NpcDialogueModal({
  npc,
  coins,
  isFirstChat,
  onSelectAction,
  onClose,
}: NpcDialogueModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#2A1D12]/55 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#FBF4E4] border-2 border-[#B99464] text-[#3A2618] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 bg-[#EFE1C4] border-b border-[#B99464]/50">
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
