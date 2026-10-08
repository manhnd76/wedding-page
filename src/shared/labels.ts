/**
 * Nhãn tiếng Việt cho MỌI giá trị enum của schema (design 8.13 v4, design-review-admin-v2 A07).
 * Admin không bao giờ hiển thị mã thô (`scroll`, `red-paper`, `envelope`…): dùng `enumLabel()`.
 * Dùng chung cho gallery, select, bảng "Thành phần của theme" và diff "Xem thay đổi".
 */
import type {
  BurstOnOpen, CountdownStyle, Divider, EnvelopeStyle, FontPresetId, Intensity, OpenStyle, OrnamentSet, ParticleType,
  PhotoFrame, RevealAtom, RevealStyle, Texture, ThemeId,
} from './config/enums.ts';
import { THEME_IDS } from './config/enums.ts';
import { PRESETS } from './theme/presets.ts';
import { isSupported, type CapabilityKey } from './capabilities.ts';

/** Tên theme lấy từ preset (một nguồn). */
export const THEME_LABEL = Object.fromEntries(THEME_IDS.map((id) => [id, PRESETS[id].name])) as Record<ThemeId, string>;

export const OPEN_STYLE_LABEL: Record<OpenStyle, string> = {
  envelope: 'Phong bì', 'card-flip': 'Lật thiệp', curtain: 'Rèm kéo', 'fade-zoom': 'Mờ dần', none: 'Không hiệu ứng',
  'wax-seal': 'Dấu sáp vỡ', origami: 'Gấp giấy', 'double-door': 'Cửa đôi', 'flower-gate': 'Cổng hoa', scroll: 'Cuộn thư',
  'card-3d': 'Thiệp 3D', 'light-gather': 'Hạt sáng tụ lại', 'gift-box': 'Hộp quà', 'moon-gate': 'Cửa trăng', book: 'Mở sách',
  'ink-spread': 'Mực loang', polaroid: 'Ảnh Polaroid',
};

/** Tên mẫu phong bì - trùng `ENVELOPE_META[id].name` (unit test giữ khớp; không import envelope.ts để admin ban đầu nhẹ). */
export const ENVELOPE_STYLE_LABEL: Record<EnvelopeStyle, string> = {
  classic: 'Cổ điển · dấu sáp', kraft: 'Giấy kraft · dây gai', 'song-hy': 'Phong bì đỏ Song Hỷ', lace: 'Ren & hoa',
  minimal: 'Tối giản', velvet: 'Nhung đêm',
};

export const PARTICLE_LABEL: Record<ParticleType, string> = {
  'petal-rose': 'Cánh hồng', 'petal-sakura': 'Hoa anh đào', 'petal-peach': 'Hoa đào', 'petal-lotus': 'Cánh sen',
  'petal-dried': 'Hoa khô', 'petal-watercolor': 'Cánh hoa màu nước', plumeria: 'Hoa sứ', heart: 'Tim', 'paper-heart': 'Tim giấy',
  'leaf-green': 'Lá xanh', 'leaf-eucalyptus': 'Lá bạch đàn', 'leaf-maple': 'Lá phong', pampas: 'Cỏ lau', snow: 'Tuyết',
  bubble: 'Bong bóng', firefly: 'Đom đóm', sparkle: 'Lấp lánh', 'gold-dust': 'Bụi vàng', 'ink-dot': 'Chấm mực',
  'dust-mote': 'Bụi nắng', 'red-paper': 'Giấy đỏ',
};

export const BURST_LABEL: Record<BurstOnOpen, string> = {
  none: 'Không', confetti: 'Hoa giấy', petals: 'Cánh hoa', gold: 'Kim tuyến vàng', 'red-paper': 'Pháo giấy đỏ',
};

export const REVEAL_LABEL: Record<RevealStyle, string> = {
  soft: 'Mềm mại', gentle: 'Nhẹ nhàng', editorial: 'Tạp chí', letter: 'Từng chữ', playful: 'Vui tươi', cinematic: 'Điện ảnh',
};

export const REVEAL_ATOM_LABEL: Record<RevealAtom, string> = {
  fade: 'Mờ dần', 'fade-up': 'Mờ dần đi lên', 'slide-side': 'Trượt ngang', 'zoom-in': 'Phóng to', 'mask-up': 'Mở từ dưới lên',
  wipe: 'Quét', 'photo-settle': 'Ảnh đặt xuống', 'rise-tilt': 'Nâng nghiêng', 'blur-in': 'Rõ dần', 'split-words': 'Từng từ',
  'split-chars': 'Từng chữ cái', 'svg-draw': 'Vẽ nét', 'parallax-layers': 'Nhiều lớp', none: 'Không',
};

export const ORNAMENT_LABEL: Record<OrnamentSet, string> = {
  'classic-line': 'Nét cổ điển', romantic: 'Lãng mạn', traditional: 'Truyền thống (song hỷ)', minimal: 'Tối giản', deco: 'Deco',
  lotus: 'Hoa sen', watercolor: 'Màu nước', boho: 'Boho', korean: 'Hàn Quốc', luxe: 'Sang trọng', tropical: 'Nhiệt đới',
};

export const TEXTURE_LABEL: Record<Texture, string> = {
  paper: 'Giấy', 'paper-aged': 'Giấy cũ', linen: 'Vải lanh', kraft: 'Giấy kraft', 'rice-paper': 'Giấy dó',
  'watercolor-wash': 'Loang màu nước', velvet: 'Nhung', 'grain-fine': 'Hạt mịn', sand: 'Cát', none: 'Không',
};

export const PHOTO_FRAME_LABEL: Record<PhotoFrame, string> = {
  arch: 'Vòm', 'arch-double': 'Vòm đôi', 'rect-offset': 'Chữ nhật lệch', 'soft-rect': 'Bo góc', 'circle-moon': 'Trăng tròn',
  oval: 'Bầu dục', polaroid: 'Polaroid', stamp: 'Tem thư', scallop: 'Viền sò', 'wash-mask': 'Loang màu', 'deco-cut': 'Deco',
};

export const DIVIDER_LABEL: Record<Divider, string> = {
  ornament: 'Hoạ tiết', wave: 'Sóng', none: 'Không', 'leaf-branch': 'Cành lá', 'double-line': 'Hai nét', cloud: 'Mây',
  lotus: 'Hoa sen', dots: 'Chấm', 'brush-stroke': 'Nét cọ', 'torn-paper': 'Giấy xé', 'deco-fan': 'Quạt Deco', 'wave-ocean': 'Sóng biển',
};

export const COUNTDOWN_STYLE_LABEL: Record<CountdownStyle, string> = { flip: 'Lật số', slide: 'Trượt số', odometer: 'Đồng hồ cơ', simple: 'Đơn giản' };

export const INTENSITY_LABEL: Record<Intensity, string> = { off: 'Tắt', low: 'Nhẹ', medium: 'Vừa', high: 'Nhiều' };

export const FONT_PRESET_LABEL: Record<FontPresetId | 'theme', string> = {
  theme: 'Theo theme', 'co-dien': 'Cổ điển', 'thanh-lich': 'Thanh lịch', 'am-ap': 'Ấm áp', 'bien-tap': 'Biên tập', 'truyen-thong': 'Truyền thống',
};

/** Giá trị enum theo đường dẫn config (diff, nhãn chung). */
const BY_PATH: Record<string, Record<string, string>> = {
  'theme.preset': THEME_LABEL,
  'theme.ornamentSet': ORNAMENT_LABEL,
  'theme.texture': TEXTURE_LABEL,
  'theme.photoFrame': PHOTO_FRAME_LABEL,
  'sections.divider': DIVIDER_LABEL,
  'cover.openStyle': OPEN_STYLE_LABEL,
  'cover.background': { paper: 'Giấy (theo theme)', image: 'Ảnh' },
  'cover.envelope.style': ENVELOPE_STYLE_LABEL,
  'cover.envelope.color': { auto: 'Theo mẫu' },
  'effects.intensity': INTENSITY_LABEL,
  'effects.burst.onOpen': BURST_LABEL,
  'effects.burst.countdownFireworks': { 'every-view': 'Mỗi lần cuộn tới', 'wedding-day': 'Chỉ ngày cưới', off: 'Tắt' },
  'effects.particles.types': PARTICLE_LABEL,
  'effects.particles.color': { multi: 'Nhiều màu' },
  'effects.particles.scope': { all: 'Cả trang', 'hero-thankyou': 'Chỉ Hero & Cảm ơn' },
  'effects.reveal.style': REVEAL_LABEL,
  'effects.reveal.heading': REVEAL_ATOM_LABEL,
  'effects.reveal.block': REVEAL_ATOM_LABEL,
  'effects.reveal.image': REVEAL_ATOM_LABEL,
  'effects.reveal.ornament': REVEAL_ATOM_LABEL,
  'effects.autoScroll.mode': { flow: 'Dừng ngắn ở mỗi phần', steady: 'Chạy đều' },
  'effects.micro.wishFly': { 'paper-plane': 'Máy bay giấy', bubble: 'Bong bóng', heart: 'Trái tim' },
  'content.countdown.style': COUNTDOWN_STYLE_LABEL,
  'content.couple.order': { 'groom-first': 'Chú rể trước', 'bride-first': 'Cô dâu trước' },
  'content.album.layout': { masonry: 'So le', grid: 'Lưới', carousel: 'Băng chuyền' },
  'fonts.preset': FONT_PRESET_LABEL,
};

/** Nhãn của 1 giá trị enum tại `path`; "theme" -> "Theo theme". Không biết -> undefined. */
export function enumLabel(path: string, value: unknown): string | undefined {
  if (value === 'theme') return 'Theo theme';
  if (typeof value !== 'string') return undefined;
  return BY_PATH[path]?.[value];
}

/** Có bảng nhãn cho đường dẫn này không (diff dùng để định dạng mảng loại hạt…). */
export const hasEnumLabels = (path: string): boolean => path in BY_PATH;

/**
 * Nhãn lựa chọn "Theo theme (…)" ghi đúng cái khách sẽ thấy (design 8.13 v4):
 * theme gợi ý giá trị chưa có ở bản hiện tại -> "Theo theme (Phong bì · Cuộn thư sẽ có ở bản sau)".
 */
export function followThemeLabel<T extends string>(labels: Record<T, string>, suggested: T, resolved: T): string {
  const now = labels[resolved] ?? 'Mặc định';
  if (suggested === resolved) return `Theo theme (${now})`;
  return `Theo theme (${now} · ${labels[suggested] ?? 'kiểu khác'} sẽ có ở bản sau)`;
}

/** Như trên nhưng tự xét capability (vd openStyle `scroll` chưa có -> fallback). */
export function capLabel<T extends string>(key: CapabilityKey, labels: Record<T, string>, value: T): string {
  return isSupported(key, value) ? labels[value] : `${labels[value]} (sẽ có ở bản sau)`;
}
