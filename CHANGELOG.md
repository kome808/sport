# Changelog

## [2026-01-28] - Dashboard & Fatigue Monitoring Updates

### Added
- **Metric Information Dialogs**: Added clickable info icons to dashboard table headers (RHR, Wellness, Training Load) providing detailed scientific explanations and alert thresholds (Green/Yellow/Red).
- **Navigation Links**: Added links to player names in the "Player Feedback Overview" table for quick access to their specific Fatigue page.
- **Realistic Demo Data**: Updated `manual_fatigue_update.sql` to generate realistic random feedback strings (e.g., "Right knee feels tight") and pain descriptions instead of static text.

### Changed
- **Wellness Chart**: Updated Y-axis maximum from 25 to 50 to match the new scoring scale.
- **Wellness Chart**: Updated description text to correctly state the range is "5-50".
- **Dashboard Date for Demo**: Hardcoded the default selected date to `2026-01-27` when viewing the `shohoku-basketball` demo team to ensure consistent data presentation.
- **Data Generation**: Added `wellness_total` calculation to the demo data generation script to fix missing data issues on the frontend.
- **Demo Team Cleanup**: Added automatic deletion of "Doraemon Baseball Team" (`doraemon-baseball`) in the manual update script to keep the demo environment clean.

### Fixed
- **SQL Syntax**: Fixed a syntax error in `manual_fatigue_update.sql` where `INSERT INTO` was accidentally truncated.
- **Display Issues**: Resolved issues where blocks on the dashboard appeared white/transparent by fixing CSS/data mapping.
