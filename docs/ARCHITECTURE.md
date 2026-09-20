# Architecture

## State
- `src/stores/useConfiguratorStore` — current `YachtConfiguration` + module actions
- `src/data/options` — catalog (ids, labels, prices, asset paths)
- `src/three/*` — R3F scenes subscribe to store ids and load matching GLBs

## Flow
UI option click → `select*()` → `config` updates → Three scene remounts / swaps assets
