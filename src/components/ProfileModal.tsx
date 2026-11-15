import { useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Award,
  CheckCircle2,
  Cloud,
  CloudDownload,
  CloudUpload,
  Lock,
  LogIn,
  LogOut,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react';
import {
  EFELER_GEZGINI_BADGES,
  FURNITURE_STYLE_SHOP,
  getGezginRank,
  HOUSE_STYLE_OPTIONS,
  LANDMARKS,
  PROFILE_AVATAR_EMOJIS,
} from '../data/efelerData';
import { signInWithGooglePopup, signOutUser } from '../services/profileService';
import { GezginBadgeCategory, HouseExteriorConfig } from '../types/game';

interface ProfileModalProps {
  displayName: string;
  avatarEmoji: string;
  coins: number;
  lokmaPower: number;
  discoveredIds: string[];
  completedErrandIds: string[];
  chattedNpcCount: number;
  unlockedStyleCount: number;
  houseExterior: HouseExteriorConfig;
  firebaseUser: User | null;
  cloudSyncing: boolean;
  cloudStatusMessage: string | null;
  cloudErrorMessage: string | null;
  onChangeDisplayName: (next: string) => void;
  onChangeAvatarEmoji: (emoji: string) => void;
  onManualCloudSave: () => Promise<void>;
  onManualCloudLoad: () => Promise<void>;
  onClose: () => void;
}

export function ProfileModal({
  displayName,
  avatarEmoji,
  coins,
  lokmaPower,
  discoveredIds,
  completedErrandIds,
  chattedNpcCount,
  unlockedStyleCount,
  houseExterior,
  firebaseUser,
  cloudSyncing,
  cloudStatusMessage,
  cloudErrorMessage,
  onChangeDisplayName,
  onChangeAvatarEmoji,
  onManualCloudSave,
  onManualCloudLoad,
  onClose,
}: ProfileModalProps) {
  const [authBusy, setAuthBusy] = useState(false);
  const [localAuthError, setLocalAuthError] = useState<string | null>(null);
  const [badgeFilter, setBadgeFilter] = useState<'all' | GezginBadgeCategory>('all');

  const houseLabel =
    HOUSE_STYLE_OPTIONS.find((h) => h.id === houseExterior.style)?.name || 'Kır Villası';

  const badgeEntries = useMemo(() => {
    return EFELER_GEZGINI_BADGES.map((badge) => {
      const unlocked =
        badge.category === 'landmark'
          ? discoveredIds.includes(badge.targetId)
          : completedErrandIds.includes(badge.targetId);
      return { badge, unlocked };
    });
  }, [completedErrandIds, discoveredIds]);

  const unlockedTotal = badgeEntries.filter((e) => e.unlocked).length;
  const landmarkEntries = badgeEntries.filter((e) => e.badge.category === 'landmark');
  const errandEntries = badgeEntries.filter((e) => e.badge.category === 'errand');
  const landmarkUnlocked = landmarkEntries.filter((e) => e.unlocked).length;
  const errandUnlocked = errandEntries.filter((e) => e.unlocked).length;
  const rank = getGezginRank(unlockedTotal, badgeEntries.length);

  const visibleBadges = useMemo(() => {
    const filtered =
      badgeFilter === 'all'
        ? badgeEntries
        : badgeEntries.filter((e) => e.badge.category === badgeFilter);
    return [...filtered].sort((a, b) => Number(b.unlocked) - Number(a.unlocked));
  }, [badgeEntries, badgeFilter]);

  const handleGoogleSignIn = async () => {
    setAuthBusy(true);
    setLocalAuthError(null);
    try {
      await signInWithGooglePopup();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('popup-closed-by-user')) {
        setLocalAuthError('Giriş penceresi kapatıldı. Dilerseniz tekrar deneyebilirsiniz.');
      } else if (message.includes('popup-blocked')) {
        setLocalAuthError('Tarayıcı açılır pencereyi engelledi. İzin verip tekrar deneyin.');
      } else {
        setLocalAuthError('Google ile giriş tamamlanamadı. Yerel kaydınız güvende.');
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    setAuthBusy(true);
    setLocalAuthError(null);
    try {
      await signOutUser();
    } catch {
      setLocalAuthError('Çıkış yapılırken bir sorun oluştu.');
    } finally {
      setAuthBusy(false);
    }
  };

  const progressPct =
    badgeEntries.length > 0 ? Math.round((unlockedTotal / badgeEntries.length) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1C120B]/75 flex items-center justify-center p-3 sm:p-6 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Oyuncu Profili ve Kayıt"
    >
      <div className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto efeler-scroll rounded-3xl bg-[#F7EEDC] border-2 border-[#B99464] shadow-2xl text-[#3A2618] p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#B99464]/40 pb-3.5">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl bg-[#EFE0C3] border-2 border-[#B99464] flex items-center justify-center text-2xl shadow-sm shrink-0"
              aria-hidden="true"
            >
              <span key={avatarEmoji}>{avatarEmoji}</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#3A2618] leading-tight">
                  Efeler Profilim &amp; Kayıt
                </h2>
                <span className="px-2 py-0.5 rounded-lg bg-[#C85A32]/15 border border-[#C85A32]/35 text-[11px] font-bold text-[#B84C27]">
                  {rank.title}
                </span>
              </div>
              <p className="text-xs text-[#6B5038] mt-0.5">
                İncir, Lokma puanların, Efeler Gezgini rozetlerin ve ev tasarımın otomatik saklanır.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Profili Kapat"
            className="p-2 rounded-xl bg-[#EDE0C6] hover:bg-[#E2D1B2] text-[#5B432F] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Profile Identity Editor */}
        <div className="rounded-2xl bg-[#FAF2E2] border border-[#B99464]/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#3A2618]">
            <UserIcon className="w-3.5 h-3.5 text-[#C85A32]" aria-hidden="true" />
            <span>Gezgin Kimliği</span>
          </div>

          <div>
            <label
              htmlFor="efeler-profile-name"
              className="block text-[11px] font-semibold text-[#6B5038] mb-1"
            >
              Oyuncu Adı
            </label>
            <input
              id="efeler-profile-name"
              type="text"
              maxLength={40}
              value={displayName}
              onChange={(e) => onChangeDisplayName(e.target.value)}
              placeholder="Efeler Gezgini"
              className="w-full px-3.5 py-2 rounded-xl bg-[#F7EEDC] border-2 border-[#B99464]/70 focus:border-[#C85A32] outline-none text-sm font-semibold text-[#3A2618]"
            />
          </div>

          <div>
            <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">Profil Simgesi</div>
            <div className="flex flex-wrap items-center gap-1.5">
              {PROFILE_AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onChangeAvatarEmoji(emoji)}
                  className={`w-9 h-9 rounded-xl border-2 text-lg flex items-center justify-center transition-transform cursor-pointer ${
                    avatarEmoji === emoji
                      ? 'bg-[#C85A32]/15 border-[#C85A32] scale-105 shadow-sm'
                      : 'bg-[#F7EEDC] border-[#B99464]/50 hover:bg-[#EFE0C3]'
                  }`}
                >
                  <span>{emoji}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Saved Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-2xl bg-[#FAF2E2] border border-[#B99464]/50 p-3 text-center">
            <div className="text-[11px] font-semibold text-[#6B5038]">İncir Puanı</div>
            <div className="font-mono-num text-lg font-bold text-[#B84C27] mt-0.5">{coins}</div>
          </div>
          <div className="rounded-2xl bg-[#FAF2E2] border border-[#B99464]/50 p-3 text-center">
            <div className="text-[11px] font-semibold text-[#6B5038]">Lokma Puanı</div>
            <div className="font-mono-num text-lg font-bold text-[#8F5624] mt-0.5">
              {lokmaPower}
            </div>
          </div>
          <div className="rounded-2xl bg-[#FAF2E2] border border-[#B99464]/50 p-3 text-center">
            <div className="text-[11px] font-semibold text-[#6B5038]">Keşfedilen Yer</div>
            <div className="font-mono-num text-lg font-bold text-[#4B743B] mt-0.5">
              {discoveredIds.length}/{LANDMARKS.length}
            </div>
          </div>
          <div className="rounded-2xl bg-[#FAF2E2] border border-[#B99464]/50 p-3 text-center">
            <div className="text-[11px] font-semibold text-[#6B5038]">Mobilya Stili</div>
            <div className="font-mono-num text-lg font-bold text-[#3A2618] mt-0.5">
              {unlockedStyleCount}/{FURNITURE_STYLE_SHOP.length}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#EFE0C3]/75 border border-[#B99464]/50 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#5B432F]">
          <span>
            Aktif Ev Modeli: <strong className="text-[#3A2618]">{houseLabel}</strong>
          </span>
          <span>
            Sohbet Edilen Esnaf: <strong className="text-[#3A2618]">{chattedNpcCount}</strong>
          </span>
        </div>

        {/* Efeler Gezgini Rozetleri Showcase */}
        <div className="rounded-2xl bg-[#FAF2E2] border-2 border-[#B99464]/65 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#C85A32]" aria-hidden="true" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#3A2618]">
                  Efeler Gezgini Rozetleri
                </h3>
                <p className="text-[11px] text-[#6B5038]">
                  Keşfedilen her tarihi yapı ve tamamlanan her görev yeni bir rozet kazandırır.
                </p>
              </div>
            </div>
            <span className="font-mono-num px-2.5 py-1 rounded-lg bg-[#EFE0C3] border border-[#B99464]/50 text-xs font-bold text-[#3A2618]">
              {unlockedTotal} / {badgeEntries.length} Rozet
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-[#E5D3B3] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#C85A32] transition-[width] duration-300"
              style={{ width: `${Math.max(progressPct, unlockedTotal > 0 ? 6 : 0)}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setBadgeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                badgeFilter === 'all'
                  ? 'bg-[#C85A32] text-[#FAF2E2]'
                  : 'bg-[#EDE0C6] text-[#5B432F] hover:bg-[#E2D1B2]'
              }`}
            >
              Tümü ({unlockedTotal}/{badgeEntries.length})
            </button>
            <button
              type="button"
              onClick={() => setBadgeFilter('landmark')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                badgeFilter === 'landmark'
                  ? 'bg-[#5D8A48] text-[#FAF2E2]'
                  : 'bg-[#EDE0C6] text-[#5B432F] hover:bg-[#E2D1B2]'
              }`}
            >
              Tarihi Yapılar ({landmarkUnlocked}/{landmarkEntries.length})
            </button>
            <button
              type="button"
              onClick={() => setBadgeFilter('errand')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                badgeFilter === 'errand'
                  ? 'bg-[#8F5624] text-[#FAF2E2]'
                  : 'bg-[#EDE0C6] text-[#5B432F] hover:bg-[#E2D1B2]'
              }`}
            >
              Görevler ({errandUnlocked}/{errandEntries.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto efeler-scroll pr-1">
            {visibleBadges.map(({ badge, unlocked }) => (
              <div
                key={badge.id}
                className={`rounded-xl border p-3 flex items-start gap-3 transition-colors ${
                  unlocked
                    ? 'bg-[#F7EEDC] border-[#C85A32]/55 shadow-sm'
                    : 'bg-[#EFE0C3]/55 border-[#B99464]/35 opacity-75'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-lg shrink-0 ${
                    unlocked
                      ? 'bg-[#FAF2E2] shadow-sm'
                      : 'bg-[#E6D6BC]/70 border-[#B99464]/40 grayscale'
                  }`}
                  style={unlocked ? { borderColor: badge.accentColor } : undefined}
                  aria-hidden="true"
                >
                  <span>{badge.icon}</span>
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        badge.category === 'landmark' ? 'text-[#4B743B]' : 'text-[#8F5624]'
                      }`}
                    >
                      {badge.category === 'landmark' ? 'Yapı Rozeti' : 'Görev Rozeti'}
                    </span>
                    {unlocked ? (
                      <span
                        key="unlocked"
                        className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#456D36]"
                      >
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                        <span>Kazanıldı</span>
                      </span>
                    ) : (
                      <span
                        key="locked"
                        className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#7A614A]"
                      >
                        <Lock className="w-3 h-3" aria-hidden="true" />
                        <span>Kilitli</span>
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-bold text-[#3A2618] leading-snug">
                    {badge.title}
                  </div>
                  <div className="text-[11px] font-semibold text-[#6B5038]">
                    {badge.subtitle}
                  </div>
                  <p className="text-[11px] text-[#5E4530] leading-snug">
                    {unlocked
                      ? badge.description
                      : badge.category === 'landmark'
                        ? `${badge.subtitle} noktasına gidip [E] ile keşfedin.`
                        : `Keşif Defteri'nden "${badge.subtitle.replace('Görev · ', '')}" görevini tamamlayın.`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cloud Save & Google Auth Section */}
        <div className="rounded-2xl bg-[#FAF2E2] border-2 border-[#B99464]/65 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#3A2618]">
              <Cloud className="w-4 h-4 text-[#5D8A48]" aria-hidden="true" />
              <span>Bulut Kayıt Hesabı (Firebase)</span>
            </div>
            {firebaseUser ? (
              <span
                key="cloud-online"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#5D8A48]/15 text-[#456D36] text-[11px] font-semibold"
              >
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Bağlı</span>
              </span>
            ) : (
              <span
                key="cloud-local"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#EDE0C6] text-[#6B5038] text-[11px] font-semibold"
              >
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                <span>Yalnızca Bu Cihaz</span>
              </span>
            )}
          </div>

          {!firebaseUser ? (
            <div className="space-y-2.5">
              <p className="text-xs text-[#6B5038] leading-relaxed">
                Şu anda puanların ve ev tasarımın tarayıcında otomatik saklanıyor. Farklı cihazlardan
                devam etmek ve puanlarının hiç silinmemesi için Google hesabınla bağla.
              </p>
              <button
                type="button"
                disabled={authBusy}
                onClick={handleGoogleSignIn}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#C85A32] hover:bg-[#B44D28] disabled:opacity-60 text-[#FAF2E2] text-xs sm:text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span key={authBusy ? 'busy' : 'idle'}>
                  {authBusy ? 'Bağlanılıyor...' : 'Google ile Giriş Yap & Buluta Kaydet'}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl bg-[#F7EEDC] border border-[#B99464]/50 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="font-semibold text-[#3A2618] truncate">
                    {firebaseUser.displayName || displayName}
                  </div>
                  {firebaseUser.email && (
                    <div className="text-[11px] text-[#6B5038] truncate">{firebaseUser.email}</div>
                  )}
                </div>
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#EDE0C6] hover:bg-[#E2D1B2] text-xs font-semibold text-[#5B432F] transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Çıkış</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={cloudSyncing}
                  onClick={() => void onManualCloudSave()}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#5D8A48] hover:bg-[#4F783C] disabled:opacity-60 text-[#FAF2E2] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <CloudUpload className="w-4 h-4" aria-hidden="true" />
                  <span key={cloudSyncing ? 'saving' : 'save'}>
                    {cloudSyncing ? 'Kaydediliyor...' : 'Buluta Şimdi Kaydet'}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={cloudSyncing}
                  onClick={() => void onManualCloudLoad()}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#EDE0C6] hover:bg-[#E2D1B2] disabled:opacity-60 border border-[#B99464]/60 text-[#3A2618] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <CloudDownload className="w-4 h-4" aria-hidden="true" />
                  <span>Buluttan Yükle</span>
                </button>
              </div>
            </div>
          )}

          {cloudStatusMessage && (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#456D36]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{cloudStatusMessage}</span>
            </div>
          )}

          {(localAuthError || cloudErrorMessage) && (
            <div className="rounded-xl bg-[#B84C27]/10 border border-[#B84C27]/40 px-3 py-2 text-[11px] font-semibold text-[#9E3918]">
              {localAuthError || cloudErrorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
