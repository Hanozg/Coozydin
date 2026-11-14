# Firestore rule tests

Requires Node.js 24.12 or later and Java 21 or later.

Run from the repository root:

```bash
npm ci --prefix tests/firestore
npm test --prefix tests/firestore
```

The first run downloads the Firestore emulator. Tests use the local emulator
on `127.0.0.1:18080` and the `demo-coozydin-tests` project ID. Firebase login and
production credentials are not required. The emulator stops when the test run ends.

The suite reads the repository's `firestore.rules` directly and uses independent
test fixtures. It does not import the game's Firebase configuration or services.
Tests clear the emulator's data between cases and check profile access, valid
writes, timestamps, required fields, and profiles with all lists at their limits.
Permission-denied messages are expected for requests that the tests assert must
be rejected. Check the final test summary for failures.

The scoped gRPC override addresses the reported high-severity finding in the
test SDK. The Firebase CLI dependency chain still has moderate npm audit findings.
