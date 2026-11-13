import { useMemo, useState } from 'react';
import { Calendar, Check, ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { AgendaNote } from '../types/game';

interface AgendaModalProps {
  notes: AgendaNote[];
  onAddNote: (dateKey: string, text: string) => void;
  onToggleNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onClose: () => void;
}

const MONTH_NAMES_TR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

const WEEKDAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function AgendaModal({
  notes,
  onAddNote,
  onToggleNote,
  onDeleteNote,
  onClose,
}: AgendaModalProps) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    toDateKey(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const [draftText, setDraftText] = useState('');

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    // Monday = 0, Sunday = 6
    const startOffset = (firstDay.getDay() + 6) % 7;
    const cells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const notesByDate = useMemo(() => {
    const map = new Map<string, AgendaNote[]>();
    for (const n of notes) {
      const list = map.get(n.dateKey) || [];
      list.push(n);
      map.set(n.dateKey, list);
    }
    return map;
  }, [notes]);

  const selectedNotes = notesByDate.get(selectedDateKey) || [];
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draftText.trim();
    if (!trimmed) return;
    onAddNote(selectedDateKey, trimmed);
    setDraftText('');
  };

  const [selY, selM, selD] = selectedDateKey.split('-').map(Number);
  const selectedLabel = `${selD} ${MONTH_NAMES_TR[(selM || 1) - 1]} ${selY}`;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#12100C]/80 p-4">
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl bg-[#1A1713] border border-[#F5EFE6]/15 text-[#F5EFE6] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F5EFE6]/10">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#D99B43]" aria-hidden="true" />
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight">
                Kişisel Ajanda &amp; Takvim
              </h2>
              <p className="text-xs text-[#BEB5A6]">
                Günlük notlarınızı, planlarınızı ve sakin düşüncelerinizi saklayın
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Ajandayı Kapat"
            className="p-2 rounded-lg bg-[#27221B] hover:bg-[#332C23] text-[#E6DCCB] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body: Left Monthly Calendar + Right Daily Notes */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#F5EFE6]/10">
          {/* Calendar Column */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Önceki Ay"
                className="p-1.5 rounded-lg bg-[#25211B] hover:bg-[#322C24] border border-[#F5EFE6]/10 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <div className="font-display text-base font-semibold">
                {MONTH_NAMES_TR[viewMonth]} {viewYear}
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Sonraki Ay"
                className="p-1.5 rounded-lg bg-[#25211B] hover:bg-[#322C24] border border-[#F5EFE6]/10 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[#A89F91] mb-2">
              {WEEKDAYS_TR.map((wd) => (
                <div key={wd} className="py-1">
                  {wd}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-10" />;
                }
                const key = toDateKey(viewYear, viewMonth, day);
                const dayNotes = notesByDate.get(key) || [];
                const isSelected = key === selectedDateKey;
                const isToday = key === todayKey;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDateKey(key)}
                    className={`h-10 rounded-lg border flex flex-col items-center justify-center relative transition-colors cursor-pointer font-mono-num text-xs ${
                      isSelected
                        ? 'bg-[#D99B43] border-[#D99B43] text-[#181612] font-bold'
                        : isToday
                          ? 'bg-[#2A241B] border-[#D99B43]/50 text-[#F5EFE6]'
                          : 'bg-[#221E18] border-[#F5EFE6]/8 text-[#E6DCCB] hover:bg-[#2C2720]'
                    }`}
                  >
                    <span>{day}</span>
                    {dayNotes.length > 0 && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                          isSelected ? 'bg-[#181612]' : 'bg-[#89C490]'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Notes Column */}
          <div className="p-5 flex flex-col">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#D99B43] font-semibold">
                  Seçili Gün
                </div>
                <h3 className="font-display text-lg font-semibold">{selectedLabel}</h3>
              </div>
              <span className="font-mono-num text-xs text-[#A89F91]">
                {selectedNotes.length} Not
              </span>
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Bugün için not veya yapılacak ekle..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#25211B] border border-[#F5EFE6]/12 text-sm text-[#F5EFE6] placeholder:text-[#8E8577] focus:outline-none focus:border-[#D99B43]"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D99B43] hover:bg-[#E4AC59] text-[#181612] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Ekle</span>
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {selectedNotes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#F5EFE6]/12 p-6 text-center text-xs text-[#A89F91]">
                  Bu tarih için henüz not yok. Lo-Fi eşliğinde gününüzü planlayabilirsiniz.
                </div>
              ) : (
                selectedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-[#221E18] border border-[#F5EFE6]/10 px-3.5 py-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleNote(note.id)}
                      className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                    >
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          note.done
                            ? 'bg-[#61B88A] border-[#61B88A] text-[#181612]'
                            : 'border-[#F5EFE6]/25 bg-[#1A1713]'
                        }`}
                      >
                        {note.done && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                      </span>
                      <span
                        className={`text-sm break-words ${
                          note.done ? 'line-through text-[#8E8577]' : 'text-[#F5EFE6]'
                        }`}
                      >
                        {note.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteNote(note.id)}
                      aria-label="Notu Sil"
                      className="p-1.5 rounded-lg text-[#A89F91] hover:text-[#E07A68] hover:bg-[#2E2820] transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
