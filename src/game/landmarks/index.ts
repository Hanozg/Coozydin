import { LandmarkDef } from '../../types/game';
import { CityMaterialLibrary } from '../materials';
import { mergeStaticGroupMeshes } from '../meshMerge';
import { getTerrainHeightAt } from '../terrain';
import { buildMagnesia, buildTralleis } from './ancient';
import { buildForumAvm, buildKipaAvm, buildSevgiYolu, buildYagcilarIci } from './bazaarsAndMalls';
import {
  buildNevzatBicerPark,
  buildOrtaMahalle,
  buildSariBelediye,
  buildTekstilPark,
  buildTrenGari,
  buildUniversite,
} from './civicAndParks';
import { buildKentMeydani } from './kentMeydani';
import {
  buildBeyCamii,
  buildCihanoglu,
  buildNasuhPasa,
  buildRamazanPasa,
} from './ottoman';
import { BuiltLandmark, LandmarkBuilder } from './shared';

/**
 * Extensible landmark builder registry.
 * Adding a new 3D landmark only requires registering its builder function here.
 */
export const LANDMARK_BUILDERS: Record<string, LandmarkBuilder> = {
  tralleis: buildTralleis,
  beycamii: buildBeyCamii,
  nasuhpasa: buildNasuhPasa,
  ramazanpasa: buildRamazanPasa,
  cihanoglu: buildCihanoglu,
  kentmeydani: buildKentMeydani,
  saribelediye: buildSariBelediye,
  tekstilpark: buildTekstilPark,
  forumaydin: buildForumAvm,
  trengari: buildTrenGari,
  ortamahalle: buildOrtaMahalle,
  universite: buildUniversite,
  magnesia: buildMagnesia,
  nevzatbicerpark: buildNevzatBicerPark,
  kipaavm: buildKipaAvm,
  sevgiyolu: buildSevgiYolu,
  yagcilarici: buildYagcilarIci,
};

export function buildAllLandmarks(
  defs: LandmarkDef[],
  mats: CityMaterialLibrary
): BuiltLandmark[] {
  return defs.map((def) => {
    const builder = LANDMARK_BUILDERS[def.id] ?? buildKentMeydani;
    const built = builder(def, mats);
    const [lx, , lz] = def.position;
    built.group.position.y = getTerrainHeightAt(lx, lz);
    mergeStaticGroupMeshes(built.group);
    return built;
  });
}

export type { BuiltLandmark, LandmarkBuilder } from './shared';
