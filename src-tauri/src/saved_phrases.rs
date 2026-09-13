use std::path::Path;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use tauri::{AppHandle, Manager, State};

use crate::error::AppError;

pub const DATABASE_FILE: &str = "saved-phrases.sqlite3";
/// Mirrored by `savedPhraseLimits.text` in the frontend, which is what the
/// editor counts against; the database enforces the same ceiling.
pub const MAX_TEXT_LENGTH: usize = 500;
const SCHEMA_VERSION: i64 = 1;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedPhrase {
	pub id: i64,
	pub text: String,
	pub created_at: i64,
	pub updated_at: i64,
}

pub struct SavedPhrases {
	connection: Mutex<Connection>,
}

fn storage_error(error: impl std::fmt::Display) -> AppError {
	AppError::Storage(error.to_string())
}

fn now_ms() -> i64 {
	SystemTime::now()
		.duration_since(UNIX_EPOCH)
		.map(|elapsed| elapsed.as_millis() as i64)
		.unwrap_or_default()
}

/// Opens the database next to the rest of the app's local data and hands it to
/// the app. A database that cannot be opened is not fatal: the commands report
/// the failure instead, so the rest of the app keeps working.
pub fn initialize(app: &AppHandle) -> Result<(), AppError> {
	let directory = app.path().app_local_data_dir().map_err(storage_error)?;
	std::fs::create_dir_all(&directory).map_err(storage_error)?;
	let connection = connect(&directory.join(DATABASE_FILE))?;
	app.manage(SavedPhrases {
		connection: Mutex::new(connection),
	});
	Ok(())
}

fn connect(path: &Path) -> Result<Connection, AppError> {
	let connection = Connection::open(path).map_err(storage_error)?;
	migrate(&connection)?;
	Ok(connection)
}

fn migrate(connection: &Connection) -> Result<(), AppError> {
	let version: i64 = connection
		.query_row("PRAGMA user_version", [], |row| row.get(0))
		.map_err(storage_error)?;
	if version >= SCHEMA_VERSION {
		return Ok(());
	}
	connection
		.execute_batch(&format!(
			"CREATE TABLE IF NOT EXISTS saved_phrases (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				text TEXT NOT NULL,
				created_at INTEGER NOT NULL,
				updated_at INTEGER NOT NULL
			);
			PRAGMA user_version = {SCHEMA_VERSION};"
		))
		.map_err(storage_error)
}

/// Newest first, so a phrase just added is the one at the top of every list.
fn list(connection: &Connection) -> Result<Vec<SavedPhrase>, AppError> {
	let mut statement = connection
		.prepare(
			"SELECT id, text, created_at, updated_at FROM saved_phrases
			 ORDER BY created_at DESC, id DESC",
		)
		.map_err(storage_error)?;
	let rows = statement
		.query_map([], |row| {
			Ok(SavedPhrase {
				id: row.get(0)?,
				text: row.get(1)?,
				created_at: row.get(2)?,
				updated_at: row.get(3)?,
			})
		})
		.map_err(storage_error)?;
	rows.collect::<rusqlite::Result<Vec<_>>>()
		.map_err(storage_error)
}

fn validate(text: &str) -> Result<&str, AppError> {
	let text = text.trim();
	if text.is_empty() {
		return Err(storage_error("A saved phrase cannot be empty"));
	}
	if text.chars().count() > MAX_TEXT_LENGTH {
		return Err(storage_error(format!(
			"A saved phrase can be at most {MAX_TEXT_LENGTH} characters"
		)));
	}
	Ok(text)
}

fn add(connection: &Connection, text: &str) -> Result<SavedPhrase, AppError> {
	let text = validate(text)?;
	let now = now_ms();
	connection
		.execute(
			"INSERT INTO saved_phrases (text, created_at, updated_at)
			 VALUES (?1, ?2, ?2)",
			params![text, now],
		)
		.map_err(storage_error)?;
	Ok(SavedPhrase {
		id: connection.last_insert_rowid(),
		text: text.to_owned(),
		created_at: now,
		updated_at: now,
	})
}

/// `None` when no phrase carries that id, so the caller can tell "changed" from
/// "was already gone".
fn update(
	connection: &Connection,
	id: i64,
	text: &str,
) -> Result<Option<SavedPhrase>, AppError> {
	let text = validate(text)?;
	let now = now_ms();
	let changed = connection
		.execute(
			"UPDATE saved_phrases SET text = ?1, updated_at = ?2 WHERE id = ?3",
			params![text, now, id],
		)
		.map_err(storage_error)?;
	if changed == 0 {
		return Ok(None);
	}
	Ok(Some(read(connection, id)?))
}

fn read(connection: &Connection, id: i64) -> Result<SavedPhrase, AppError> {
	connection
		.query_row(
			"SELECT id, text, created_at, updated_at FROM saved_phrases WHERE id = ?1",
			params![id],
			|row| {
				Ok(SavedPhrase {
					id: row.get(0)?,
					text: row.get(1)?,
					created_at: row.get(2)?,
					updated_at: row.get(3)?,
				})
			},
		)
		.optional()
		.map_err(storage_error)?
		.ok_or_else(|| storage_error("That saved phrase no longer exists"))
}

fn delete(connection: &Connection, id: i64) -> Result<(), AppError> {
	connection
		.execute("DELETE FROM saved_phrases WHERE id = ?1", params![id])
		.map_err(storage_error)?;
	Ok(())
}

impl SavedPhrases {
	/// The lock is held for the length of a single query, so a poisoned mutex
	/// means a previous command panicked while it held the connection.
	fn connection(
		&self,
	) -> Result<std::sync::MutexGuard<'_, Connection>, AppError> {
		self.connection
			.lock()
			.map_err(|_| storage_error("The saved phrases database is locked"))
	}
}

#[tauri::command]
pub fn saved_phrases_list(
	state: State<'_, SavedPhrases>,
) -> Result<Vec<SavedPhrase>, AppError> {
	let connection = state.connection()?;
	list(&connection)
}

#[tauri::command]
pub fn saved_phrases_add(
	state: State<'_, SavedPhrases>,
	text: String,
) -> Result<SavedPhrase, AppError> {
	let connection = state.connection()?;
	add(&connection, &text)
}

#[tauri::command]
pub fn saved_phrases_update(
	state: State<'_, SavedPhrases>,
	id: i64,
	text: String,
) -> Result<SavedPhrase, AppError> {
	let connection = state.connection()?;
	update(&connection, id, &text)?
		.ok_or_else(|| storage_error("That saved phrase no longer exists"))
}

#[tauri::command]
pub fn saved_phrases_delete(
	state: State<'_, SavedPhrases>,
	id: i64,
) -> Result<(), AppError> {
	let connection = state.connection()?;
	delete(&connection, id)
}

#[cfg(test)]
mod tests {
	use super::*;

	fn database() -> Connection {
		let connection = Connection::open_in_memory().unwrap();
		migrate(&connection).unwrap();
		connection
	}

	#[test]
	fn starts_empty() {
		assert!(list(&database()).unwrap().is_empty());
	}

	#[test]
	fn adds_and_reads_back_a_phrase() {
		let connection = database();

		let added = add(&connection, "Hey").unwrap();

		assert_eq!(added.text, "Hey");
		assert!(added.created_at > 0);
		assert_eq!(added.created_at, added.updated_at);
		assert_eq!(list(&connection).unwrap(), vec![added]);
	}

	#[test]
	fn trims_what_it_stores() {
		let connection = database();

		let added = add(&connection, "  on my way  ").unwrap();

		assert_eq!(added.text, "on my way");
		assert_eq!(
			update(&connection, added.id, "\n later \t")
				.unwrap()
				.unwrap()
				.text,
			"later"
		);
	}

	#[test]
	fn refuses_empty_phrases() {
		let connection = database();

		assert!(add(&connection, "   ").is_err());
		let added = add(&connection, "Hey").unwrap();
		assert!(update(&connection, added.id, " ").is_err());
		assert_eq!(list(&connection).unwrap(), vec![added]);
	}

	#[test]
	fn refuses_a_phrase_past_the_length_limit() {
		let connection = database();
		let too_long = "a".repeat(MAX_TEXT_LENGTH + 1);

		assert!(add(&connection, &too_long).is_err());
		let added = add(&connection, "Hey").unwrap();
		assert!(update(&connection, added.id, &too_long).is_err());
		// Exactly at the limit is fine.
		assert!(add(&connection, &"a".repeat(MAX_TEXT_LENGTH)).is_ok());
	}

	#[test]
	fn lists_the_newest_first() {
		let connection = database();

		let first = add(&connection, "first").unwrap();
		let second = add(&connection, "second").unwrap();

		assert_eq!(
			list(&connection).unwrap(),
			vec![second, first],
			"the row just added belongs at the top"
		);
	}

	#[test]
	fn updates_a_phrase_and_keeps_its_creation_time() {
		let connection = database();
		let added = add(&connection, "Hey").unwrap();

		let updated =
			update(&connection, added.id, "Hey there").unwrap().unwrap();

		assert_eq!(updated.id, added.id);
		assert_eq!(updated.text, "Hey there");
		assert_eq!(updated.created_at, added.created_at);
		// SQLite's clock has millisecond resolution, so the update can land in
		// the same millisecond as the insert.
		assert!(updated.updated_at >= added.updated_at);
		assert_eq!(list(&connection).unwrap().len(), 1);
	}

	#[test]
	fn reports_a_missing_phrase_instead_of_pretending() {
		let connection = database();

		assert!(update(&connection, 404, "Hey").unwrap().is_none());
	}

	#[test]
	fn deletes_a_phrase_and_tolerates_a_missing_one() {
		let connection = database();
		let added = add(&connection, "Hey").unwrap();

		delete(&connection, added.id).unwrap();
		delete(&connection, added.id).unwrap();

		assert!(list(&connection).unwrap().is_empty());
	}

	#[test]
	fn migrates_once_and_remembers_its_version() {
		let connection = database();

		migrate(&connection).unwrap();

		let version: i64 = connection
			.query_row("PRAGMA user_version", [], |row| row.get(0))
			.unwrap();
		assert_eq!(version, SCHEMA_VERSION);
		// Running the migration again must not wipe what is already stored.
		let added = add(&connection, "Hey").unwrap();
		migrate(&connection).unwrap();
		assert_eq!(list(&connection).unwrap(), vec![added]);
	}

	#[test]
	fn a_phrase_survives_reopening_the_database() {
		let directory = std::env::temp_dir()
			.join(format!("open-grind-saved-phrases-{}", std::process::id()));
		std::fs::create_dir_all(&directory).unwrap();
		let path = directory.join(DATABASE_FILE);
		let _ = std::fs::remove_file(&path);

		let added = {
			let connection = connect(&path).unwrap();
			add(&connection, "See you there").unwrap()
		};
		let reopened = connect(&path).unwrap();

		assert_eq!(list(&reopened).unwrap(), vec![added]);
		std::fs::remove_dir_all(&directory).ok();
	}
}
