import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface MergeStaticOptions {
  /** Keep castShadow only on meshes whose bounding volume exceeds this threshold, or preserve existing flags */
  preserveShadowFlags?: boolean;
}

/**
 * Merges static child THREE.Mesh objects inside `root` into one mesh per
 * (material, castShadow, receiveShadow) bucket in `root`'s local space.
 * Dramatically cuts WebGL draw calls (e.g. 90+ meshes per house -> ~8 meshes).
 */
export function mergeStaticGroupMeshes(
  root: THREE.Group,
  _opts?: MergeStaticOptions
): void {
  root.updateMatrixWorld(true);
  const invRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const relMatrix = new THREE.Matrix4();

  interface Bucket {
    material: THREE.Material;
    castShadow: boolean;
    receiveShadow: boolean;
    hasColor: boolean;
    geos: THREE.BufferGeometry[];
  }

  const materialIds = new Map<THREE.Material, number>();
  let nextMatId = 1;
  const buckets = new Map<string, Bucket>();
  const meshesToRemove: THREE.Mesh[] = [];

  root.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    if ((obj as THREE.InstancedMesh).isInstancedMesh) return;
    if ((obj as THREE.SkinnedMesh).isSkinnedMesh) return;
    const mesh = obj as THREE.Mesh;
    if (mesh.userData?.noMerge || mesh.userData?.interactionType) return;
    if (!mesh.visible) return;
    if (Array.isArray(mesh.material)) return;
    const mat = mesh.material;
    if (!mat || mat.visible === false) return;

    let matId = materialIds.get(mat);
    if (matId === undefined) {
      matId = nextMatId++;
      materialIds.set(mat, matId);
    }

    const hasColor = Boolean(mesh.geometry.getAttribute('color'));
    const key = `${matId}_${mesh.castShadow ? 1 : 0}_${mesh.receiveShadow ? 1 : 0}_${hasColor ? 1 : 0}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        material: mat,
        castShadow: mesh.castShadow,
        receiveShadow: mesh.receiveShadow,
        hasColor,
        geos: [],
      };
      buckets.set(key, bucket);
    }

    relMatrix.multiplyMatrices(invRoot, mesh.matrixWorld);
    const cloned = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    cloned.applyMatrix4(relMatrix);

    if (!cloned.getAttribute('normal')) {
      cloned.computeVertexNormals();
    }
    const posAttr = cloned.getAttribute('position');
    if (!cloned.getAttribute('uv') && posAttr) {
      cloned.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(posAttr.count * 2), 2));
    }

    // Keep only matching standard attributes so mergeGeometries never fails
    const keepAttrs = new Set<string>(['position', 'normal', 'uv']);
    if (hasColor) keepAttrs.add('color');
    for (const attrName of Object.keys(cloned.attributes)) {
      if (!keepAttrs.has(attrName)) {
        cloned.deleteAttribute(attrName);
      }
    }

    bucket.geos.push(cloned);
    meshesToRemove.push(mesh);
  });

  if (meshesToRemove.length === 0) return;

  // Remove old meshes and dispose their unmerged geometries
  for (const m of meshesToRemove) {
    m.parent?.remove(m);
    if (!m.geometry.userData?.isSharedHumanGeo && !m.geometry.userData?.isSharedGeo) {
      m.geometry.dispose();
    }
  }

  // Prune now-empty child groups
  for (let i = root.children.length - 1; i >= 0; i--) {
    const child = root.children[i];
    if (child.children.length === 0 && !(child as THREE.Mesh).isMesh) {
      root.remove(child);
    }
  }

  // Emit merged meshes
  for (const bucket of buckets.values()) {
    if (bucket.geos.length === 0) continue;
    const mergedGeo =
      bucket.geos.length === 1 ? bucket.geos[0] : mergeGeometries(bucket.geos, false);
    if (bucket.geos.length > 1) {
      for (const g of bucket.geos) g.dispose();
    }
    if (!mergedGeo) continue;
    const mergedMesh = new THREE.Mesh(mergedGeo, bucket.material);
    mergedMesh.castShadow = bucket.castShadow;
    mergedMesh.receiveShadow = bucket.receiveShadow;
    root.add(mergedMesh);
  }
}
