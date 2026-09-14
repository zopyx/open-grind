# Changelog

All notable changes to Open Grind are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
version numbers follow [SemVer](https://semver.org/spec/v2.0.0.html) (see
[Versioning](./CONTRIBUTING.md#versioning)).

Every change a user can notice gets an entry under `Unreleased`, in the section
it belongs to. Cutting a release moves those entries under the version being
released, so this file always describes both what shipped and what is on `main`
but unreleased. Build date and version are shown in the app under
Settings → App → About Open Grind.

## [Unreleased]

### Added

- Grid filter presets: the filter sheet (grid top bar → "All filters") now has a
  preset row. Pick a preset to fill the filters, save the current filters as
  your own named preset, and delete your own ones again. Built-in presets cannot
  be edited or deleted.
- The same preset picker sits at the right end of the grid's top bar, where
  picking a preset applies it straight away instead of filling the sheet.
- A built-in `Bondage 18-30 Bottom/Side/Vers Bottom` preset — Bondage tag, ages
  18 to 30, bottom, side and vers bottom. A fresh install starts from it, and
  "Reset filters" goes back to it.
- A built-in `Online Master` preset — online right now, Bondage tag, top or vers
  top, no age filter.
- About dialog under Settings → App, showing the app version, the date the build
  was produced, the Grindr API version it talks to, and links to the website,
  the source and this changelog.
- Saved phrases: the composer's bookmark button (next to the attachment button)
  opens your own phrases; tapping one puts it in the draft. They are stored in a
  local SQLite database on the device, and Settings → App → Saved phrases lets
  you add, edit and delete them.
- Messaging several profiles at once: the button at the right end of the grid's
  top bar turns the photo grid into a selection grid. Pick any number of
  profiles, tap "Message", type one text and send it: every selected profile
  gets the same message as its own message, a second apart, with a progress bar
  during the run and a list of the profiles that could not be reached. The run
  can be stopped between two messages.

### Changed

- Grid filters a fresh install starts from are no longer empty: they are the
  built-in preset. Installations that already stored filters keep them.
- The age and position quick filters reset to the default preset's values
  (18-30, bottom) instead of clearing the field.

### Fixed

- The built-in presets filter for the lowercase `bondage` tag the API actually
  returns, instead of `Bondage`, which matched no tag and left the tag filter
  showing as unselected.
