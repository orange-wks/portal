import mikawa from './mikawa.mjs';
import roma from './roma.mjs';
import tang from './tang.mjs';
import aztec from './aztec.mjs';
import england from './england.mjs';
import romaOnna from './roma-onna.mjs';

export const STAGES = { [mikawa.id]: mikawa, [roma.id]: roma, [tang.id]: tang, [aztec.id]: aztec, [england.id]: england, [romaOnna.id]: romaOnna };
export const DEFAULT_STAGE = roma.id;
export const stageFor = (stage = DEFAULT_STAGE) => typeof stage === 'string' ? STAGES[stage] : stage;
