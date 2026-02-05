#!/usr/bin/env python3
"""
Fix headers and column order for the inbox_buffer sheet.

Requirements:
- Environment variable GSHEET_ID with the spreadsheet ID.
- Application Default Credentials with access to the sheet.

This script reorders columns based on header names and ensures A:I matches:
timestamp, whatsapp, message_id, message_type, text, media_id, media_mime, status, batch_id
"""

from __future__ import annotations

import os
from typing import List

from googleapiclient.discovery import build


HEADERS = [
    "timestamp",
    "whatsapp",
    "message_id",
    "message_type",
    "text",
    "media_id",
    "media_mime",
    "status",
    "batch_id",
]


def normalize(value: str) -> str:
    return (value or "").strip().lower()


def build_reordered_rows(rows: List[List[str]]) -> List[List[str]]:
    if not rows:
        return [HEADERS]

    current_headers = rows[0]
    header_index = {}
    for idx, header in enumerate(current_headers):
        key = normalize(header)
        if key and key not in header_index:
            header_index[key] = idx

    reordered = [HEADERS]
    for row in rows[1:]:
        new_row = []
        for header in HEADERS:
            source_idx = header_index.get(normalize(header))
            new_row.append(row[source_idx] if source_idx is not None and source_idx < len(row) else "")
        reordered.append(new_row)
    return reordered


def main() -> None:
    sheet_id = os.environ.get("GSHEET_ID")
    if not sheet_id:
        raise SystemExit("Missing GSHEET_ID environment variable.")

    service = build("sheets", "v4")
    sheet = service.spreadsheets()

    read = sheet.values().get(spreadsheetId=sheet_id, range="inbox_buffer").execute()
    rows = read.get("values", [])
    reordered_rows = build_reordered_rows(rows)

    sheet.values().update(
        spreadsheetId=sheet_id,
        range="inbox_buffer!A1:I",
        valueInputOption="RAW",
        body={"values": reordered_rows},
    ).execute()


if __name__ == "__main__":
    main()
