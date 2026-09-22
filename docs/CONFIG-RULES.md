# Config Rules

- Store values are **option ids** from `src/data/options`, never display labels.
- Step ids match `YachtConfiguration` fields and drive GLB layers via `meshPrefix` in `STEPS`.
- `selectHull` → meshes `Hull_*`; accent / sunpad / interior follow the same prefix rule.
- `toggleDetail` shows/hides meshes listed in each detail option's `mesh` field (`Detail_*`).
- Changing an option must keep other module selections intact.
