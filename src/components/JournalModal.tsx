import { useState } from 'react';
import { Check, Compass, MapPin, Package, X } from 'lucide-react';
import { COZY_ERRANDS, LANDMARKS } from '../data/efelerData';
import { ErrandDef, LandmarkDef } from '../types/game';

interface JournalModalProps {
  discoveredIds: string[];
  activeErrand: ErrandDef | null;
  errandPickedUp: boolean;
  onSelectErrand: (errand: ErrandDef | null) => void;
  onNavigateToLandmark: (landmark: LandmarkDef) => void;
  onClose: () => void;
}

export function JournalModal({
  discoveredIds,
  activeErrand,
  errandPickedUp,
  onSelectErrand,
  onNavigateToLandmark,
  onClose,
}: JournalModalProps) {
  const [tab, setTab] = useState<'landmarks' | 'errands'>('landmarks');

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#14120F]/78 p-4 md:p-8">
      <div className="w-full max-w-3xl max-h-[84vh] flex flex-col rounded-2xl bg-[#1E1B16] border border-[#F5EFE6]/12 text-[#F5EFE6] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F5EFE6]/10">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight">
              Efeler Keşif Defteri
            </h2>
            <p className="text-xs text-[#BEB5A6] mt-0.5">
              {discoveredIds.length} / {LANDMARKS.length} tarihi yapı keşfedildi
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#14120F]">
              <button
                type="button"
                onClick={() => setTab('landmarks')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  tab === 'landmarks'
                    ? 'bg-[#D99B43] text-[#181612]'
                    : 'text-[#CFC6B8] hover:text-[#F5EFE6]'
                }`}
              >
                Tarihi Yapılar
              </button>
              <button
                type="button"
                onClick={() => setTab('errands')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  tab === 'errands'
                    ? 'bg-[#D99B43] text-[#181612]'
                    : 'text-[#CFC6B8] hover:text-[#F5EFE6]'
                }`}
              >
                Sakin Görevler
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Defteri Kapat"
              className="p-2 rounded-lg text-[#CFC6B8] hover:text-[#F5EFE6] hover:bg-[#2A2620] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto efeler-scroll p-6 space-y-4">
          {tab === 'landmarks' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LANDMARKS.map((lm) => {
                const isDiscovered = discoveredIds.includes(lm.id);
                return (
                  <div
                    key={lm.id}
                    className="flex flex-col justify-between rounded-xl p-4 bg-[#25211B] border border-[#F5EFE6]/8"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-[#BEB5A6] mb-1.5">
                        <span>
                          {lm.district} · {lm.era}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            isDiscovered ? 'text-[#89C490]' : 'text-[#D99B43]'
                          }`}
                        >
                          {isDiscovered ? (
                            <>
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Keşfedildi</span>
                            </>
                          ) : (
                            <>
                              <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Bekliyor</span>
                            </>
                          )}
                        </span>
                      </div>

                      <h3 className="font-display text-base font-semibold text-[#F5EFE6] mb-2">
                        {lm.name}
                      </h3>

                      <p className="text-xs text-[#CFC6B8] leading-relaxed mb-2">
                        {lm.summary}
                      </p>
                      <p className="text-xs text-[#A89F91] leading-relaxed">
                        {lm.architectureNote}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#F5EFE6]/8">
                      <span className="text-xs text-[#D99B43] font-mono-num">
                        +{lm.rewardCoins} İncir Puanı
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigateToLandmark(lm)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#322D25] hover:bg-[#3E382E] text-xs font-medium text-[#F5EFE6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#D99B43]" aria-hidden="true" />
                        <span>Yakınına Git</span>
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="md:col-span-2 rounded-xl p-4 bg-[#221E18] border border-[#D99B43]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-[#D99B43] font-medium">
                    Sonraki Aşama · Çok Yakında
                  </div>
                  <div className="font-display text-sm md:text-base font-semibold text-[#F5EFE6] mt-0.5">
                    Aydın’a Ait Diğer Antik Kentler Çok Yakında!
                  </div>
                  <p className="text-xs text-[#BEB5A6] mt-0.5">
                    Nysa, Aphrodisias, Magnesia, Miletos, Priene ve Alinda rotaları Efeler dışındaki
                    yeni harita genişlemeleriyle oyuna eklenecek.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {COZY_ERRANDS.map((err) => {
                const isActive = activeErrand?.id === err.id;
                const fromName =
                  LANDMARKS.find((l) => l.id === err.fromLandmarkId)?.name || '';
                const toName =
                  LANDMARKS.find((l) => l.id === err.toLandmarkId)?.name || '';
                return (
                  <div
                    key={err.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl p-4 bg-[#25211B] border border-[#F5EFE6]/8"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-[#D99B43]">
                        <Package className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>
                          {fromName} → {toName}
                        </span>
                      </div>
                      <h3 className="font-display text-base font-semibold text-[#F5EFE6]">
                        {err.title}
                      </h3>
                      <p className="text-xs text-[#CFC6B8] max-w-xl">{err.description}</p>
                      {isActive && (
                        <p className="text-xs text-[#89C490] pt-0.5">
                          Durum:{' '}
                          {errandPickedUp
                            ? `Teslimat için ${toName} noktasına sürün`
                            : `Paketi almak için ${fromName} noktasına sürün`}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-[#D99B43] font-mono-num">
                        +{err.rewardCoins} Puan
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectErrand(isActive ? null : err)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-[#3A3229] text-[#F5EFE6] hover:bg-[#493E32]'
                            : 'bg-[#D99B43] text-[#181612] hover:bg-[#E4AC59]'
                        }`}
                      >
                        {isActive ? 'Görevi Bırak' : 'Görevi Al'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
