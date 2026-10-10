/**
 * Add-on capability theo đợt (solution-v4a-2bc.md 0.1, 3.2).
 * Mỗi đợt chỉ sửa file của mình (`v4a-1.ts`, `v4a-2a.ts`, `v4a-2b.ts`, `v4a-2c.ts`);
 * `capabilities.ts` ghép `supported` = danh sách gốc (v2.3) + add-on của các đợt.
 * Key MỚI (chưa có trong `CAPABILITIES`) chỉ thêm trong vùng đánh dấu của đợt mình.
 */
import type {
  BurstOnOpen, CountdownStyle, Divider, EnvelopeStyle, FontId, OpenStyle, OrnamentSet, ParticleType, PhotoFrame,
  RevealAtom, RevealStyle, Texture, ThemeId,
} from '../config/enums.ts';
// [v4a-1] imports >>>
import type { MotifSet } from '../config/enums.ts';
// [v4a-1] imports <<<

export interface CapsAddon {
  theme?: readonly ThemeId[];
  openStyle?: readonly OpenStyle[];
  particle?: readonly ParticleType[];
  envelopeStyle?: readonly EnvelopeStyle[];
  burstOnOpen?: readonly BurstOnOpen[];
  revealStyle?: readonly RevealStyle[];
  revealAtom?: readonly RevealAtom[];
  ornamentSet?: readonly OrnamentSet[];
  texture?: readonly Texture[];
  photoFrame?: readonly PhotoFrame[];
  divider?: readonly Divider[];
  countdownStyle?: readonly CountdownStyle[];
  font?: readonly FontId[];
  // [v4a-1] >>>
  /** B2 hoạ tiết nền: bộ đã có asset + module (`none` luôn có) */
  motifSet?: readonly (MotifSet | 'none')[];
  // [v4a-1] <<<

  // [v4a-2a] >>>
  // [v4a-2a] <<<
}
