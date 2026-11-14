import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

let environment;
let ownerDb;
let otherDb;
let guestDb;
let unverifiedDb;

before(async () => {
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:18080');
  environment = await initializeTestEnvironment({
    projectId: 'demo-coozydin-tests',
    firestore: {
      host: '127.0.0.1',
      port: 18080,
      rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'),
    },
  });
  ownerDb = environment.authenticatedContext('alice', { email_verified: true }).firestore();
  otherDb = environment.authenticatedContext('bob', { email_verified: true }).firestore();
  guestDb = environment.unauthenticatedContext().firestore();
  unverifiedDb = environment.authenticatedContext('alice', { email_verified: false }).firestore();
});

beforeEach(async () => {
  await environment.clearFirestore();
});

after(async () => {
  await environment?.cleanup();
});

function validProfile() {
  return {
    uid: 'alice',
    displayName: 'Test Player',
    avatarEmoji: '🏡',
    coins: 10,
    lokmaPower: 2,
    discoveredIds: ['tralleis'],
    completedErrandIds: [],
    chattedNpcIds: [],
    unlockedFurnitureStyles: ['armchair:classic'],
    vehicleConfig: {
      type: 'car', color: '#336699', finish: 'gloss', accentColor: '#ffffff',
      hasAccessory: true, hasStripe: true,
    },
    houseExterior: {
      style: 'cottage_villa', wallColor: '#ffffff', roofColor: '#884422', trimColor: '#ffffff',
    },
    cozyRoomState: {
      wallColor: '#ffffff', floorTone: 'oak', lampOn: true, petType: 'both',
      petAffection: 0, avatarPlaced: true,
      avatarConfig: {
        skinColor: '#cc9966', shirtColor: '#336699', pantsColor: '#333333',
        hairStyle: 'short', hairColor: '#442211',
      },
      furniture: [{ id: 'armchair', enabled: true, slotIndex: 0, styleId: 'classic' }],
    },
    agendaNotes: [{ id: 'note-1', dateKey: '2026-11-14', text: 'Visit Tralleis', done: false }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

async function seedProfile() {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users', 'alice'), validProfile());
  });
}

test('verified owner can create a valid profile', async () => {
  await assertSucceeds(setDoc(doc(ownerDb, 'users', 'alice'), validProfile()));
});

test('guest cannot create a profile', async () => {
  await assertFails(setDoc(doc(guestDb, 'users', 'alice'), validProfile()));
});

test('unverified owner cannot create a profile', async () => {
  await assertFails(setDoc(doc(unverifiedDb, 'users', 'alice'), validProfile()));
});

test('another user cannot create a profile for its owner', async () => {
  await assertFails(setDoc(doc(otherDb, 'users', 'alice'), validProfile()));
});

test('owner can read an existing profile', async () => {
  await seedProfile();
  const snapshot = await assertSucceeds(getDoc(doc(ownerDb, 'users', 'alice')));
  assert.equal(snapshot.data().uid, 'alice');
});

test('another user cannot read an existing profile', async () => {
  await seedProfile();
  await assertFails(getDoc(doc(otherDb, 'users', 'alice')));
});

test('guest cannot read an existing profile', async () => {
  await seedProfile();
  await assertFails(getDoc(doc(guestDb, 'users', 'alice')));
});

test('owner cannot list the users collection', async () => {
  await seedProfile();
  await assertFails(getDocs(collection(ownerDb, 'users')));
});

test('verified owner can update a profile', async () => {
  await seedProfile();
  await assertSucceeds(updateDoc(doc(ownerDb, 'users', 'alice'), {
    coins: 20, updatedAt: serverTimestamp(),
  }));
});

test('another user cannot update a profile', async () => {
  await seedProfile();
  await assertFails(updateDoc(doc(otherDb, 'users', 'alice'), {
    coins: 20, updatedAt: serverTimestamp(),
  }));
});

test('unverified owner cannot update a profile', async () => {
  await seedProfile();
  await assertFails(updateDoc(doc(unverifiedDb, 'users', 'alice'), {
    coins: 20, updatedAt: serverTimestamp(),
  }));
});

test('owner cannot change the profile creation timestamp', async () => {
  await seedProfile();
  await assertFails(updateDoc(doc(ownerDb, 'users', 'alice'), {
    createdAt: Timestamp.fromMillis(0), updatedAt: serverTimestamp(),
  }));
});

test('owner cannot forge a profile update timestamp', async () => {
  await seedProfile();
  await assertFails(updateDoc(doc(ownerDb, 'users', 'alice'), {
    updatedAt: Timestamp.fromMillis(0),
  }));
});

test('owner cannot add an unknown profile field', async () => {
  await seedProfile();
  await assertFails(updateDoc(doc(ownerDb, 'users', 'alice'), {
    isAdmin: true, updatedAt: serverTimestamp(),
  }));
});

for (const coins of [-1, 1.5, 1000001]) {
  test(`owner cannot save invalid coins: ${coins}`, async () => {
    await assertFails(setDoc(doc(ownerDb, 'users', 'alice'), { ...validProfile(), coins }));
  });
}

test('verified owner can delete a profile', async () => {
  await seedProfile();
  await assertSucceeds(deleteDoc(doc(ownerDb, 'users', 'alice')));
});

test('another user cannot delete a profile', async () => {
  await seedProfile();
  await assertFails(deleteDoc(doc(otherDb, 'users', 'alice')));
});

test('unverified owner cannot delete a profile', async () => {
  await seedProfile();
  await assertFails(deleteDoc(doc(unverifiedDb, 'users', 'alice')));
});

function profileAtLimits() {
  const data = validProfile();
  data.displayName = 'x'.repeat(40);
  data.avatarEmoji = '🏡'.repeat(6);
  data.coins = 1000000;
  data.lokmaPower = 100000;
  for (const [field, count, length] of [
    ['discoveredIds', 30, 40],
    ['completedErrandIds', 40, 48],
    ['chattedNpcIds', 40, 40],
    ['unlockedFurnitureStyles', 80, 64],
  ]) {
    data[field] = Array.from({ length: count }, (_, index) =>
      `item-${index}`.padEnd(length, 'x'));
  }
  data.vehicleConfig.type = 'motorcycle';
  data.vehicleConfig.finish = 'matte';
  data.houseExterior.style = 'twin_cottage';
  data.cozyRoomState.floorTone = 'stone';
  data.cozyRoomState.petAffection = 100000;
  data.cozyRoomState.avatarConfig.hairStyle = 'bun';
  data.cozyRoomState.furniture = Array.from({ length: 20 }, () => ({
    id: 'armchair', enabled: true, slotIndex: 10,
    x: 1.25, z: -2.5, rotY: 3.14, styleId: 'x'.repeat(40),
  }));
  data.agendaNotes = Array.from({ length: 120 }, (_, index) => ({
    id: `note-${index}`.padEnd(48, 'x'),
    dateKey: '2026-11-14', text: 'x'.repeat(240), done: true,
  }));
  return data;
}

test('owner can create a profile with all lists at their limits', async () => {
  await assertSucceeds(setDoc(doc(ownerDb, 'users', 'alice'), profileAtLimits()));
});

test('owner can update all editable fields to a populated profile', async () => {
  await assertSucceeds(setDoc(doc(ownerDb, 'users', 'alice'), validProfile()));
  const data = profileAtLimits();
  delete data.createdAt;
  await assertSucceeds(updateDoc(doc(ownerDb, 'users', 'alice'), data));
});

const requiredFieldGroups = [
  [[], ['uid', 'displayName', 'avatarEmoji', 'coins', 'lokmaPower',
    'discoveredIds', 'chattedNpcIds', 'unlockedFurnitureStyles',
    'vehicleConfig', 'houseExterior', 'cozyRoomState', 'agendaNotes',
    'createdAt', 'updatedAt']],
  [['vehicleConfig'], ['type', 'color', 'finish', 'accentColor', 'hasAccessory', 'hasStripe']],
  [['houseExterior'], ['style', 'wallColor', 'roofColor', 'trimColor']],
  [['cozyRoomState'], ['wallColor', 'floorTone', 'lampOn', 'petType',
    'petAffection', 'avatarPlaced', 'avatarConfig', 'furniture']],
  [['cozyRoomState', 'avatarConfig'], ['skinColor', 'shirtColor', 'pantsColor', 'hairStyle', 'hairColor']],
  [['cozyRoomState', 'furniture', 0], ['id', 'enabled', 'slotIndex']],
  [['agendaNotes', 0], ['id', 'dateKey', 'text', 'done']],
];

for (const [prefix, fields] of requiredFieldGroups) {
  for (const field of fields) {
    const path = [...prefix, field].join('.');
    test(`owner cannot create a profile missing ${path}`, async () => {
      const data = validProfile();
      const container = prefix.reduce((value, key) => value[key], data);
      delete container[field];
      await assertFails(setDoc(doc(ownerDb, 'users', 'alice'), data));
    });
  }
}

test('optional completion and furniture style fields can remain absent', async () => {
  const data = validProfile();
  delete data.completedErrandIds;
  delete data.cozyRoomState.furniture[0].styleId;
  await assertSucceeds(setDoc(doc(ownerDb, 'users', 'alice'), data));
});
