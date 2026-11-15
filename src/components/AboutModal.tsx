import { useState } from 'react';
import { Check, Compass, Copy, Mail, MapPin, Music, Sparkles, User, X } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

const DEVELOPER_NAME = 'Oğuz Han ÖZGÜR';
const DEVELOPER_EMAIL = 'oguzhanozgur09@gmail.com';

export function AboutModal({ onClose }: AboutModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(DEVELOPER_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard API may be restricted in some iframes
    }
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#2E1E12]/65 p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div
        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto efeler-scroll rounded-2xl bg-[#F7EEDC] border-2 border-[#B99464] p-4 sm:p-7 text-[#3A2618] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 pb-4 mb-5 border-b border-[#B99464]/40">
          <div>
            <p className="text-xs text-[#B84C27] font-semibold mb-1">Hakkında</p>
            <h2
              id="about-modal-title"
              className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#3A2618] text-balance"
            >
              Efeler: Aydın Yolları
            </h2>
            <p className="text-xs text-[#6B5038] mt-1">
              Aydın’ın sokaklarını, tarihini ve sıcak atmosferini keşfetmeye adanmış 3B şehir deneyimi.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Hakkında Penceresini Kapat"
            className="p-2 rounded-xl bg-[#EDE0C6] hover:bg-[#E2D1B2] text-[#5B432F] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Developer & Contact Section */}
        <section className="pb-5 mb-5 border-b border-[#B99464]/35">
          <h3 className="text-xs font-bold text-[#6B5038] tracking-wide mb-3">
            Geliştirici ve İletişim
          </h3>

          <div className="space-y-3 rounded-xl bg-[#FAF2E2] border border-[#B99464]/50 p-3.5 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EFE0C3] border border-[#B99464]/60 flex items-center justify-center text-[#B84C27] shrink-0">
                <User className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-[#6B5038]">Geliştiren</div>
                <div className="font-display text-base font-bold text-[#3A2618]">
                  {DEVELOPER_NAME}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#B99464]/25">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#EFE0C3] border border-[#B99464]/60 flex items-center justify-center text-[#5D8A48] shrink-0">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-[#6B5038]">E-posta</div>
                  <a
                    href={`mailto:${DEVELOPER_EMAIL}`}
                    className="text-sm font-semibold text-[#B84C27] hover:underline break-all"
                  >
                    {DEVELOPER_EMAIL}
                  </a>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EDE0C6] hover:bg-[#E2D1B2] border border-[#B99464]/55 text-xs font-semibold text-[#3A2618] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#4B743B]" aria-hidden="true" />
                    <span className="text-[#4B743B]">Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#6B5038]" aria-hidden="true" />
                    <span>Kopyala</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* World & Features Summary */}
        <section className="mb-6">
          <h3 className="text-xs font-bold text-[#6B5038] tracking-wide mb-3">
            Oyun Hakkında
          </h3>
          <p className="text-xs sm:text-sm text-[#4D3623] leading-relaxed mb-4">
            Kent Meydanı’ndan Sevgi Yolu’na, Nevzat Biçer Parkı’ndan Magnesia Antik Kenti’ne kadar
            Efeler’in sokaklarını kendi temponuzda dolaşabilir; sakin bir Lo-Fi radyo eşliğinde
            şehrin hikayelerini, esnaf sohbetlerini ve gizli detaylarını keşfedebilirsiniz.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="rounded-xl bg-[#FAF2E2]/90 border border-[#B99464]/40 p-3 flex items-start gap-2.5">
              <Compass className="w-4 h-4 text-[#C85A32] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <div className="font-semibold text-[#3A2618]">Özgür Keşif Modları</div>
                <div className="text-[#6B5038] mt-0.5 leading-snug">
                  Araba, bisiklet, motosiklet, yürüyüş ve serçe uçuşu.
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#FAF2E2]/90 border border-[#B99464]/40 p-3 flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#5D8A48] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <div className="font-semibold text-[#3A2618]">Aydın Dokusu</div>
                <div className="text-[#6B5038] mt-0.5 leading-snug">
                  Tarihi yapılar, antik kentler, parklar ve canlı mahalleler.
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#FAF2E2]/90 border border-[#B99464]/40 p-3 flex items-start gap-2.5">
              <Music className="w-4 h-4 text-[#8F5624] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <div className="font-semibold text-[#3A2618]">Efeler Bölge Radyosu</div>
                <div className="text-[#6B5038] mt-0.5 leading-snug">
                  Semtlere özel huzurlu Lo-Fi istasyonları ve doğa sesleri.
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#FAF2E2]/90 border border-[#B99464]/40 p-3 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#B84C27] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <div className="font-semibold text-[#3A2618]">Sıcak Yuvam &amp; Kayıt</div>
                <div className="text-[#6B5038] mt-0.5 leading-snug">
                  Kişisel ev tasarımı, ajanda ve bulut profil senkronizasyonu.
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#B99464]/35">
          <span className="text-[11px] text-[#6B5038]">
            Görüş, öneri ve geri bildirimleriniz için iletişime geçebilirsiniz.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#C85A32] hover:bg-[#B44D28] text-[#FAF2E2] font-semibold text-xs sm:text-sm transition-colors cursor-pointer shrink-0"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
