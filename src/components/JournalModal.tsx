import { useState } from 'react';
import { Check, Compass, Landmark, MapPin, Package, Sparkles, X } from 'lucide-react';
import {
  ANCIENT_CITIES,
  ANCIENT_CITY_MAP,
  getExhibitsForCity,
  MUSEUM_EXHIBITS,
} from '../data/ancientMuseumData';
import { COZY_ERRANDS, LANDMARKS } from '../data/efelerData';
import { DAILY_EVOLUTION_LOG, UPCOMING_EVOLUTION_IDEAS } from '../data/evolutionLog';
import { AncientCityId, ErrandDef, LandmarkDef } from '../types/game';

interface JournalModalProps {
  discoveredIds: string[];
  discoveredMuseumIds?: string[];
  completedErrandIds?: string[];
  activeErrand: ErrandDef | null;
  errandPickedUp: boolean;
  initialTab?: 'landmarks' | 'museum' | 'errands' | 'evolution';
  onSelectErrand: (errand: ErrandDef | null) => void;
  onNavigateToLandmark: (landmark: LandmarkDef) => void;
  onEnterAncientMuseum?: (cityId?: AncientCityId) => void;
  onClose: () => void;
}

export function JournalModal({
  discoveredIds,
  discoveredMuseumIds = [],
  completedErrandIds = [],
  activeErrand,
  errandPickedUp,
  initialTab = 'landmarks',
  onSelectErrand,
  onNavigateToLandmark,
  onEnterAncientMuseum,
  onClose,
}: JournalModalProps) {
  const [tab, setTab] = useState<'landmarks' | 'museum' | 'errands' | 'evolution'>(initialTab);
  const [selectedCityFilter, setSelectedCityFilter] = useState<'all' | AncientCityId>('all');

  const selectedCityDef =
    selectedCityFilter === 'all' ? null : ANCIENT_CITY_MAP.get(selectedCityFilter) ?? null;
  const filteredExhibits =
    selectedCityFilter === 'all' ? MUSEUM_EXHIBITS : getExhibitsForCity(selectedCityFilter);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#2E1E12]/65 p-3 sm:p-4 md:p-8">
      <div className="w-full max-w-3xl max-h-[90dvh] flex flex-col rounded-2xl bg-[#F7EEDC] border-2 border-[#B99464] text-[#3A2618] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 border-b border-[#B99464]/45 bg-[#EFE0C3]">
          <div>
            <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-[#3A2618]">
              Efeler Keşif Defteri
            </h2>
            <p className="text-xs text-[#6B5038] mt-0.5 font-medium">
              {discoveredIds.length} / {LANDMARKS.length} tarihi yapı · {discoveredMuseumIds.length} /{' '}
              {MUSEUM_EXHIBITS.length} antik müze eseri
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#E2D0AF]">
              <button
                type="button"
                onClick={() => setTab('landmarks')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  tab === 'landmarks'
                    ? 'bg-[#C85A32] text-[#FAF2E2]'
                    : 'text-[#5B432F] hover:text-[#3A2618]'
                }`}
              >
                Tarihi Yapılar
              </button>
              <button
                type="button"
                onClick={() => setTab('museum')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  tab === 'museum'
                    ? 'bg-[#8F5624] text-[#FAF2E2]'
                    : 'text-[#5B432F] hover:text-[#3A2618]'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Antik Müze</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('errands')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  tab === 'errands'
                    ? 'bg-[#C85A32] text-[#FAF2E2]'
                    : 'text-[#5B432F] hover:text-[#3A2618]'
                }`}
              >
                Sakin Görevler
              </button>
              <button
                type="button"
                onClick={() => setTab('evolution')}
                className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  tab === 'evolution'
                    ? 'bg-[#5D8A48] text-[#FAF2E2]'
                    : 'text-[#5B432F] hover:text-[#3A2618]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Gelişim Günlüğü</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Defteri Kapat"
              className="p-2 rounded-lg text-[#6B5038] hover:text-[#3A2618] hover:bg-[#E2D0AF] transition-colors cursor-pointer"
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
                    className="flex flex-col justify-between rounded-xl p-4 bg-[#FAF3E6] border border-[#B99464]/50 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-[#6B5038] mb-1.5 font-medium">
                        <span>
                          {lm.district} · {lm.era}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            isDiscovered ? 'text-[#4B743B]' : 'text-[#B84C27]'
                          }`}
                        >
                          {isDiscovered ? (
                            <span key="discovered" className="inline-flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Keşfedildi</span>
                            </span>
                          ) : (
                            <span key="pending" className="inline-flex items-center gap-1">
                              <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Bekliyor</span>
                            </span>
                          )}
                        </span>
                      </div>

                      <h3 className="font-display text-base font-bold text-[#3A2618] mb-2">
                        {lm.name}
                      </h3>

                      <p className="text-xs text-[#543E2B] leading-relaxed mb-2">
                        {lm.summary}
                      </p>
                      <p className="text-xs text-[#7A614A] leading-relaxed">
                        {lm.architectureNote}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#B99464]/30">
                      <span className="text-xs text-[#B84C27] font-semibold font-mono-num">
                        +{lm.rewardCoins} İncir Puanı
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigateToLandmark(lm)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EDE0C6] hover:bg-[#E2D1B2] border border-[#B99464]/50 text-xs font-semibold text-[#3A2618] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#B84C27]" aria-hidden="true" />
                        <span>Yakınına Git</span>
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="md:col-span-2 rounded-xl p-4 bg-[#EFE0C3] border border-[#8F5624]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-[#8F5624] font-semibold">
                    7 Aydın Antik Kenti · Girilebilir Açık Hava Müzeleri Açıldı
                  </div>
                  <div className="font-display text-sm md:text-base font-bold text-[#3A2618] mt-0.5">
                    Tralleis, Magnesia, Nysa, Afrodisias, Priene, Milet & Didyma, Alinda & Alabanda
                  </div>
                  <p className="text-xs text-[#5E4530] mt-0.5">
                    Aydın’ın 7 büyük antik kentini 1:1 fotogerçekçi taş dokuları, omuz kamerası, tonozlu
                    mahzenleri ve Sesli Rehber destekli {MUSEUM_EXHIBITS.length} müze eseriyle keşfedin.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('museum')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8F5624] hover:bg-[#7A471D] text-[#FAF2E2] text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  <Landmark className="w-4 h-4" aria-hidden="true" />
                  <span>Antik Kentlere Bak</span>
                </button>
              </div>
            </div>
          ) : tab === 'museum' ? (
            <div className="space-y-4">
              {/* 7-City Selector Strip */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCityFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedCityFilter === 'all'
                      ? 'bg-[#8F5624] text-[#FAF2E2]'
                      : 'bg-[#EDE0C6] text-[#4E3724] hover:bg-[#E2D1B2]'
                  }`}
                >
                  Tümü ({discoveredMuseumIds.length}/{MUSEUM_EXHIBITS.length})
                </button>
                {ANCIENT_CITIES.map((c) => {
                  const list = getExhibitsForCity(c.id);
                  const found = list.filter((e) => discoveredMuseumIds.includes(e.id)).length;
                  const active = selectedCityFilter === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCityFilter(c.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#8F5624] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] text-[#4E3724] hover:bg-[#E2D1B2]'
                      }`}
                    >
                      {c.shortName}{' '}
                      <span className="font-mono-num opacity-80">
                        {found}/{list.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active City Hero Banner OR 7-City Quick Launch Grid */}
              {selectedCityDef ? (
                <div className="rounded-xl p-4 bg-[#EFE0C3] border border-[#8F5624]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-[#8F5624]">
                      {selectedCityDef.district} · {selectedCityDef.era} ·{' '}
                      {filteredExhibits.filter((e) => discoveredMuseumIds.includes(e.id)).length} /{' '}
                      {filteredExhibits.length} Eser
                    </div>
                    <div className="font-display text-sm md:text-base font-bold text-[#3A2618] mt-0.5">
                      {selectedCityDef.name} — {selectedCityDef.tagline}
                    </div>
                    <p className="text-xs text-[#5E4530] mt-0.5 leading-relaxed">
                      {selectedCityDef.description}
                    </p>
                  </div>
                  {onEnterAncientMuseum && (
                    <button
                      type="button"
                      onClick={() => onEnterAncientMuseum(selectedCityDef.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8F5624] hover:bg-[#7A471D] text-[#FAF2E2] text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                    >
                      <Landmark className="w-4 h-4" aria-hidden="true" />
                      <span>{selectedCityDef.shortName}’a Gir</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl p-4 bg-[#EFE0C3] border border-[#8F5624]/45">
                    <div className="text-xs font-semibold text-[#8F5624]">
                      Aydın Antik Kentleri Açık Hava Müze Ağı · {discoveredMuseumIds.length} /{' '}
                      {MUSEUM_EXHIBITS.length} Eser
                    </div>
                    <div className="font-display text-sm md:text-base font-bold text-[#3A2618] mt-0.5">
                      7 Girilebilir 1:1 Antik Kent — Kemerler, Tiyatrolar, Tapınaklar ve Tonozlu Mahzenler
                    </div>
                    <p className="text-xs text-[#5E4530] mt-0.5">
                      Dilediğiniz antik kente doğrudan girerek cam bilgi noktalarına yaklaşın, [E] ile
                      eserleri inceleyin ve Türkçe Sesli Rehber’i dinleyin.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {ANCIENT_CITIES.map((c) => {
                      const list = getExhibitsForCity(c.id);
                      const found = list.filter((e) => discoveredMuseumIds.includes(e.id)).length;
                      return (
                        <div
                          key={c.id}
                          className="rounded-xl p-3 bg-[#FAF3E6] border border-[#B99464]/55 flex flex-col justify-between gap-2.5 shadow-sm"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 text-[10px] font-semibold text-[#8F5624]">
                              <span>{c.district}</span>
                              <span className="font-mono-num">
                                {found}/{list.length} Eser
                              </span>
                            </div>
                            <div className="font-display text-sm font-bold text-[#3A2618] mt-0.5">
                              {c.shortName}
                            </div>
                            <div className="text-[11px] text-[#5E4530] line-clamp-2 mt-0.5">
                              {c.tagline}
                            </div>
                          </div>
                          {onEnterAncientMuseum && (
                            <button
                              type="button"
                              onClick={() => onEnterAncientMuseum(c.id)}
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8F5624] hover:bg-[#7A471D] text-[#FAF2E2] text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <Landmark className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Kente Gir</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Curated Exhibit Collection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredExhibits.map((ex) => {
                  const isFound = discoveredMuseumIds.includes(ex.id);
                  const cityLabel = ANCIENT_CITY_MAP.get(ex.cityId)?.shortName;
                  return (
                    <div
                      key={ex.id}
                      className="flex flex-col justify-between rounded-xl p-4 bg-[#FAF3E6] border border-[#B99464]/50 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 text-xs text-[#6B5038] mb-1.5 font-medium">
                          <span className="font-mono-num truncate">
                            {selectedCityFilter === 'all' && cityLabel ? `${cityLabel} · ` : ''}
                            {ex.catalogCode} · {ex.zone}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 font-semibold shrink-0 ${
                              isFound ? 'text-[#4B743B]' : 'text-[#B84C27]'
                            }`}
                          >
                            {isFound ? (
                              <>
                                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>İncelendi</span>
                              </>
                            ) : (
                              <>
                                <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Keşfedilmedi</span>
                              </>
                            )}
                          </span>
                        </div>

                        <h3 className="font-display text-base font-bold text-[#3A2618]">
                          {ex.title}
                        </h3>
                        <p className="text-[11px] text-[#8F5624] font-semibold mt-0.5 mb-2">
                          {ex.period}
                        </p>
                        <p className="text-xs text-[#543E2B] leading-relaxed">
                          {isFound ? ex.historicalStory : ex.shortDescription}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#B99464]/30 text-xs">
                        <span className="text-[#6B5038] truncate max-w-[68%]">{ex.material}</span>
                        <span className="text-[#B84C27] font-semibold font-mono-num shrink-0">
                          +{ex.rewardCoins} İncir
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : tab === 'errands' ? (
            <div className="space-y-3">
              {COZY_ERRANDS.map((err) => {
                const isActive = activeErrand?.id === err.id;
                const isCompleted = completedErrandIds.includes(err.id);
                const fromName =
                  LANDMARKS.find((l) => l.id === err.fromLandmarkId)?.name || '';
                const toName =
                  LANDMARKS.find((l) => l.id === err.toLandmarkId)?.name || '';
                return (
                  <div
                    key={err.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl p-4 bg-[#FAF3E6] border border-[#B99464]/50 shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#B84C27] font-semibold">
                        <Package className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>
                          {fromName} → {toName}
                        </span>
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#5D8A48]/15 text-[#456D36] text-[11px] font-bold">
                            <Check className="w-3 h-3" aria-hidden="true" />
                            <span>Tamamlandı · Rozet Kazanıldı</span>
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-base font-bold text-[#3A2618]">
                        {err.title}
                      </h3>
                      <p className="text-xs text-[#543E2B] max-w-xl">{err.description}</p>
                      {isActive && (
                        <p className="text-xs text-[#4B743B] font-semibold pt-0.5">
                          <span>Durum: </span>
                          <span key={errandPickedUp ? 'deliver' : 'pickup'}>
                            {errandPickedUp
                              ? `Teslimat için ${toName} noktasına sürün`
                              : `Paketi almak için ${fromName} noktasına sürün`}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-[#B84C27] font-semibold font-mono-num">
                        +{err.rewardCoins} Puan
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectErrand(isActive ? null : err)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-[#EDE0C6] text-[#3A2618] border border-[#B99464]/60 hover:bg-[#E2D1B2]'
                            : 'bg-[#C85A32] text-[#FAF2E2] hover:bg-[#B44D28]'
                        }`}
                      >
                        <span key={isActive ? 'drop' : 'take'}>
                          {isActive ? 'Görevi Bırak' : 'Görevi Al'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl p-4 bg-[#EFE0C3] border border-[#5D8A48]/45">
                <div className="text-xs font-semibold text-[#456D36]">
                  Yaşayan Efeler · Günlük Otomatik Genişleme
                </div>
                <p className="text-xs text-[#543E2B] mt-1 leading-relaxed">
                  Efeler: Aydın Yolları her gün en az bir kez kendi kodunu ve 3B dünyasını
                  geliştirerek yeni mahalleler, hareketli yaşam detayları ve sakin etkileşimler
                  ekler.
                </p>
              </div>

              <div className="space-y-3">
                {DAILY_EVOLUTION_LOG.map((entry) => {
                  const targetLm = entry.landmarkId
                    ? LANDMARKS.find((l) => l.id === entry.landmarkId)
                    : undefined;
                  return (
                    <div
                      key={entry.id}
                      className="rounded-xl p-4 bg-[#FAF3E6] border border-[#B99464]/55 shadow-sm space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B5038] font-medium">
                        <span className="font-mono-num">
                          Gün {entry.dayNumber} · {entry.date} · {entry.category}
                        </span>
                        {targetLm && (
                          <button
                            type="button"
                            onClick={() => onNavigateToLandmark(targetLm)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#EDE0C6] hover:bg-[#E2D1B2] border border-[#B99464]/50 text-xs font-semibold text-[#3A2618] transition-colors cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5 text-[#B84C27]" aria-hidden="true" />
                            <span>Yakınına Git</span>
                          </button>
                        )}
                      </div>

                      <h3 className="font-display text-base font-bold text-[#3A2618]">
                        {entry.title}
                      </h3>

                      <p className="text-xs text-[#543E2B] leading-relaxed">{entry.summary}</p>

                      <ul className="space-y-1 pt-1 border-t border-[#B99464]/25">
                        {entry.highlights.map((h, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs text-[#5E4530] leading-relaxed"
                          >
                            <span className="text-[#4B743B] font-bold mt-0.5">·</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl p-4 bg-[#FAF3E6] border border-[#B99464]/45 space-y-2">
                <div className="text-xs font-semibold text-[#B84C27]">
                  Sıradaki Gelişim Fikirleri (Yol Haritası)
                </div>
                <ul className="space-y-1">
                  {UPCOMING_EVOLUTION_IDEAS.map((idea, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#5E4530]">
                      <span className="text-[#B84C27] font-bold">·</span>
                      <span>{idea}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
