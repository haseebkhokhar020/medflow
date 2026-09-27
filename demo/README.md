# MedFlow — Complete User Walkthrough

**Video:** [Download the MP4 from GitHub Releases](https://github.com/haseebkhokhar020/medflow/releases/download/v1.0.1/MedFlow-Complete-Walkthrough-1.0.1.mp4)
**Length:** 6 min 21 sec · 1920×1080 · H.264 MP4 · Urdu spoken narration
**Captions:** English instructional captions are burned in, embedded as an optional subtitle track, and available separately as [SRT](MedFlow-Walkthrough-English-Captions.srt).

This is a guided **illustrated walkthrough made from screenshots of the actual MedFlow interface**, not an uninterrupted live screen recording. It uses exclusively fictional sample records; no real customer or patient data appears. The English captions summarize each action for learners; they are not a word-for-word translation of the Urdu audio. No clinical advice is provided.

## Chapters

| Time | Chapter | What you will learn |
|---|---|---|
| 0:00 | Introduction | Scope and fictional-data notice |
| 0:06 | First run and sign-in | Setup wizard, store profile, Owner login |
| 0:38 | Dashboard and navigation | Main view, Ctrl+K global search, Help |
| 1:15 | Suppliers and products | Create supplier, product, prices and SKU |
| 1:53 | Purchases and batches | Supplier invoices, batch expiry, stock receipt |
| 2:29 | Inventory and expiry | Batch view, expiring soon, movement history |
| 3:04 | Point of sale and receipt | Barcode lookup, cart, cash payment, receipt |
| 3:42 | Credit, returns and payments | Customer credit, sale return, settle balance |
| 4:21 | Expenses and finance | Expense entry, margin and receivables |
| 5:01 | Reports and export | Sales, stock, expiry, CSV export |
| 5:37 | Users, settings and backup | Cashier role, preferences, create/restore backup |
| 6:14 | Closing | Practice safely and make regular backups |

## Version note — important

The latest Windows installers are **v1.0.1**; the owner-confirmed full Windows 10 workflow was performed on the v1.0.0 baseline. During recording a real v1.0.0 UI defect was found: the Owner's Restore button did not render, although the backend restore workflow existed and passed its test. The source was corrected for **v1.0.1**, and the corrected UI is what appears in this video. Viewers still using the v1.0.0 installer will not see the Restore button shown at 5:56. Both v1.0.1 installers were built and verified in Windows CI; full hands-on installation testing on Windows remains to be done.

The on-screen date, September 27, 2026, comes from the isolated demo environment. The displayed credentials are only dummy training values; choose unique credentials for a real store. No Windows 7/8/11 or 32-bit compatibility is established by this Linux-based video recording.

## Production notes

`capture.mjs` automates MedFlow against an **empty, disposable training database** and saves real screenshots to `stills/`. It must not be run against a live pharmacy database. `render_video.py` assembles the MP4, SRT and `storyboard.json` from these stills and the generated narration under `audio/` (the local static ffmpeg path in the script is specific to the build workspace). The transcript-aligned captions are instructional summaries rather than a verbatim transcript.
