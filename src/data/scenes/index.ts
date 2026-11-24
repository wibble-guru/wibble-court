import type { Scene, SceneMap } from '@/engine/types';
import { B20_B21 } from './b20-b21';
import { C30_C31 } from './c30-c31';
import { D40_D41 } from './d40-d41';
import { E50_E51 } from './e50-e51';
import { ENDINGS } from './endings';
import { EPILOGUE } from './epilogue';
import { F60_F61 } from './f60-f61';
import { H80_I91 } from './h80-i91';
import { J100_J110 } from './j100-j110';
import { M65_G71 } from './m65-g71';
import { P00_A11 } from './p00-a11';

/**
 * 본편 장면 모음 (대본 3부·4부, EPILOGUE). 진실 공개(TRUTH)는 여기에 넣지 않는다 — 별도 청크.
 * 분기 장면(A10 등)의 next 는 합류 장면을 적어 두지만,
 * 실제 다음 장면은 고른 선택지의 next 가 정한다 (engine.nextSceneId).
 */
const ALL: Scene[] = [
  ...P00_A11,
  ...B20_B21,
  ...C30_C31,
  ...D40_D41,
  ...E50_E51,
  ...F60_F61,
  ...M65_G71,
  ...H80_I91,
  ...J100_J110,
  ...ENDINGS,
  ...EPILOGUE,
];

export const SCENES: SceneMap = Object.fromEntries(ALL.map((scene) => [scene.id, scene]));

export const START_SCENE = 'P00';
