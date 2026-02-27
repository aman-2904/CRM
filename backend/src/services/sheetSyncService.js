import cron from 'node-cron';
import { parse } from 'csv-parse/sync';
import supabase from '../config/supabase.js';
import { pickEmployee } from './workflowService.js';

// ─── Column Config ────────────────────────────────────────────────────────────

// All variants of the lead ID column across different sheets
const IGNORED_COLUMNS = new Set([
    // ID column variants
    'Id', 'id', 'ID', 'F',
    // Standard Facebook metadata
    'ad_id', 'ad_name', 'adset_id', 'adset_name',
    'campaign_id', 'form_id', 'form_name', 'is_organic', 'platform',
]);

// Columns that get explicitly mapped to CRM fields (not sent to notes)
const MAPPED_COLUMNS = new Set([
    'full_name', 'phone_number', 'please_enter_your_contact_no_', 'email', 'created_time', 'campaign_name',
]);

// ─── Sync State ───────────────────────────────────────────────────────────────

export const syncState = {
    lastSync: null,
    lastSyncLeadsImported: 0,
    totalImported: 0,
    isRunning: false,
    lastError: null,
};

// ─── Row Validator ────────────────────────────────────────────────────────────

/**
 * A row is valid if it has a recognisable email or phone number.
 * This filters out sheets with misaligned columns or non-lead data.
 */
function hasValidContact(row) {
    const fullName = (row['full_name'] || '').trim().toLowerCase();

    // 1. Filter out common sheet headers/garbage strings
    const JUNK_NAMES = ['true', 'full_name', 'id', 'december_2025', 'january_2026', 'february_2026', 'march_2026', 'april_2026'];
    if (JUNK_NAMES.includes(fullName)) return false;

    // Heuristic: if name contains a month name and a year, it's likely a summary row/header
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const hasMonth = months.some(m => fullName.includes(m));
    const hasYear = fullName.includes('2025') || fullName.includes('2026');
    if (hasMonth && hasYear) return false;

    const email = (row['email'] || '').trim();
    const phone = (
        row['phone_number'] ||
        row['please_enter_your_contact_no_'] || ''
    ).trim();

    // 2. Strict Email check (must have @ and a dot)
    const validEmail = email.includes('@') && email.includes('.') &&
        !email.includes(' ') && email.length > 5;

    // 3. Strict Phone check (at least 7 digits)
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const validPhone = cleanPhone.length >= 7;

    return validEmail || validPhone;
}

// ─── Row Mapper ───────────────────────────────────────────────────────────────

function mapRowToLead(row) {
    // Full name → first + last
    const fullName = (row['full_name'] || '').trim();
    const nameParts = fullName.split(/\s+/);
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    // Email
    const email = (row['email'] || '').trim();

    // Phone — try Facebook field first, then manual-entry field
    // Strip the "p:" prefix Facebook adds, and clean whitespace
    const rawPhone = (
        row['phone_number'] ||
        row['please_enter_your_contact_no_'] || ''
    ).trim();
    const phone = rawPhone.startsWith('p:') ? rawPhone.slice(2) : rawPhone;

    // Notes — all non-ignored, non-mapped columns that have a value
    const extraParts = Object.entries(row)
        .filter(([key, val]) => {
            if (IGNORED_COLUMNS.has(key)) return false;
            if (MAPPED_COLUMNS.has(key)) return false;
            return val && val.toString().trim() !== '';
        })
        .map(([key, val]) => {
            // Handle empty-header columns (unnamed remark/callback columns)
            const label = key.trim() || 'Note';
            return `${label}: ${val.toString().trim()}`;
        });

    const notes = extraParts.join(' | ');

    // created_time — the actual Facebook lead creation timestamp
    // Parse it to a valid ISO string; fall back to null (Supabase will use now())
    const rawCreatedTime = (row['created_time'] || '').trim();
    let created_at = null;
    if (rawCreatedTime) {
        const parsed = new Date(rawCreatedTime);
        if (!isNaN(parsed.getTime())) created_at = parsed.toISOString();
    }

    // campaign_name
    const campaign_name = (row['campaign_name'] || '').trim();

    return { first_name, last_name, email, phone, notes, created_at, campaign_name };
}

// ─── Fetch all sheets from a published Google Spreadsheet ────────────────────

async function fetchAllRows(fetch, baseUrl) {
    // Strip any existing query params to get the base pub URL
    const pubBase = baseUrl.split('?')[0];

    // 1. Fetch HTML index page to discover sheet GIDs
    const htmlRes = await fetch(pubBase);
    if (!htmlRes.ok) throw new Error(`Failed to fetch spreadsheet page: ${htmlRes.status}`);
    const html = await htmlRes.text();

    // Extract all gid values from the published HTML (e.g. gid=0, gid=12345678)
    const gidMatches = [...html.matchAll(/gid=(\d+)/g)];
    const gids = [...new Set(gidMatches.map(m => m[1]))];

    if (gids.length === 0) {
        // Fallback: just use the provided URL as-is
        console.log('[SheetSync] Could not discover sheet GIDs, falling back to single URL.');
        gids.push('0');
    }

    console.log(`[SheetSync] Found ${gids.length} sheet(s): gids [${gids.join(', ')}]`);

    // 2. Fetch CSV for each sheet and combine rows
    const allRows = [];
    for (const gid of gids) {
        const csvUrl = `${pubBase}?output=csv&gid=${gid}`;
        try {
            const res = await fetch(csvUrl);
            if (!res.ok) {
                console.warn(`[SheetSync] Skipping gid=${gid}: HTTP ${res.status}`);
                continue;
            }
            // Check content-type — Google returns text/html for unpublished/inaccessible sheets
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('text/html')) {
                console.warn(`[SheetSync] Skipping gid=${gid}: not a published CSV sheet`);
                continue;
            }
            const csvText = await res.text();
            // Extra safety: if response starts with HTML doctype, it's an error page
            if (csvText.trimStart().startsWith('<!')) {
                console.warn(`[SheetSync] Skipping gid=${gid}: received HTML response`);
                continue;
            }
            const rows = parse(csvText, { columns: true, skip_empty_lines: true, trim: true });
            console.log(`[SheetSync] gid=${gid}: ${rows.length} row(s)`);
            allRows.push(...rows);
        } catch (e) {
            console.warn(`[SheetSync] Error fetching gid=${gid}:`, e.message);
        }
    }

    return allRows;
}

// ─── Core Sync Function ───────────────────────────────────────────────────────

export async function runSync() {
    const csvUrl = process.env.GOOGLE_SHEET_CSV_URL;
    if (!csvUrl) {
        console.warn('[SheetSync] GOOGLE_SHEET_CSV_URL not set. Skipping sync.');
        return;
    }

    if (syncState.isRunning) {
        console.log('[SheetSync] Already running. Skipping.');
        return;
    }

    syncState.isRunning = true;
    syncState.lastError = null;

    try {
        console.log('[SheetSync] Starting sync...');

        // 1. Fetch + parse all sheets
        const { default: fetch } = await import('node-fetch');
        const rows = await fetchAllRows(fetch, csvUrl);

        if (rows.length === 0) {
            console.log('[SheetSync] No rows found in any sheet.');
            syncState.isRunning = false;
            return;
        }

        // 2. Validate & build leads from rows (skip misaligned/non-lead rows)
        const leads = rows
            .filter(hasValidContact)
            .map(mapRowToLead);

        // 4. Get existing emails AND phones from Supabase to deduplicate
        const emails = leads.map(l => l.email).filter(Boolean);
        const phones = leads.map(l => l.phone).filter(Boolean);

        const [{ data: byEmail }, { data: byPhone }] = await Promise.all([
            supabase.from('leads').select('email, phone')
                .in('email', emails.length > 0 ? emails : ['__none__']),
            supabase.from('leads').select('email, phone')
                .in('phone', phones.length > 0 ? phones : ['__none__']),
        ]);

        const existingEmails = new Set(
            [...(byEmail || []), ...(byPhone || [])].map(l => l.email?.toLowerCase()).filter(Boolean)
        );
        const existingPhones = new Set(
            [...(byEmail || []), ...(byPhone || [])].map(l => l.phone).filter(Boolean)
        );

        // 5. Filter only truly new leads (dedup by email first, then phone as fallback)
        const newLeads = leads.filter(lead => {
            if (!lead.first_name && !lead.phone) return false; // skip empty rows
            if (lead.email && existingEmails.has(lead.email.toLowerCase())) return false;
            if (!lead.email && lead.phone && existingPhones.has(lead.phone)) return false;
            return true;
        });

        if (newLeads.length === 0) {
            console.log('[SheetSync] No new leads to import.');
            syncState.lastSync = new Date().toISOString();
            syncState.lastSyncLeadsImported = 0;
            syncState.isRunning = false;
            return;
        }

        // 6. Insert into Supabase (with auto-assignment)
        const recordsToInsert = await Promise.all(newLeads.map(async (lead) => {
            const source = lead.campaign_name ? `Google Sheet: ${lead.campaign_name}` : 'Google Sheet';
            const assigned_to = await pickEmployee(source);
            const record = {
                first_name: lead.first_name,
                last_name: lead.last_name,
                email: lead.email,
                phone: lead.phone,
                notes: lead.notes,
                status: 'new',
                source,
                source_url: csvUrl, // Record which sheet link this came from
                assigned_to: assigned_to || null,
            };
            if (lead.created_at) record.created_at = lead.created_at;
            return record;
        }));

        const { error } = await supabase
            .from('leads')
            .insert(recordsToInsert);

        if (error) throw error;

        syncState.lastSync = new Date().toISOString();
        syncState.lastSyncLeadsImported = newLeads.length;
        syncState.totalImported += newLeads.length;

        console.log(`[SheetSync] ✅ Imported ${newLeads.length} new lead(s).`);

    } catch (err) {
        syncState.lastError = err.message;
        console.error('[SheetSync] ❌ Sync error:', err.message);
    } finally {
        syncState.isRunning = false;
    }
}

// ─── Cron Scheduler ──────────────────────────────────────────────────────────

export function startSheetSyncScheduler() {
    if (process.env.SHEET_SYNC_ENABLED !== 'true') {
        console.log('[SheetSync] Disabled via SHEET_SYNC_ENABLED env var.');
        return;
    }

    console.log('[SheetSync] 🚀 Scheduler started — polling every 5 minutes.');

    // Run once immediately on startup
    runSync();

    // Then every 5 minutes
    cron.schedule('*/5 * * * *', () => {
        runSync();
    });
}
