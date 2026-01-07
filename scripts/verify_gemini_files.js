
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyGeminiFiles() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
        console.error('Missing environment variables. Please check .env.local');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Note: We use the REST API approach for verification as per the service implementation
    // but here we can try to use the SDK if possible, or just raw fetch to match the service logic.
    // The service uses raw fetch for store operations, so let's stick to that for reliability.

    console.log('--- Verifying Gemini File Search Storage ---');

    // 1. Get the most recent user who attempted an upload (or just list all stores)
    const { data: stores, error: storeError } = await supabase
        .from('user_file_search_stores')
        .select('*')
        .limit(5);

    if (storeError) {
        console.error('Error fetching stores from Supabase:', storeError);
        return;
    }

    if (!stores || stores.length === 0) {
        console.log('No File Search stores found in Supabase.');
        return;
    }

    for (const store of stores) {
        console.log(`\nChecking Store: ${store.store_name} (User: ${store.user_id})`);

        // 2. Fetch files from Supabase for this store
        const { data: supabaseFiles, error: fileError } = await supabase
            .from('user_file_search_files')
            .select('id, file_search_file_name, display_name, status')
            .eq('file_search_store_id', store.id); // store.id is the UUID in Supabase, store.store_name is the Gemini ID

        if (fileError) {
            console.error(`  Error fetching files from Supabase:`, fileError);
            continue;
        }

        console.log(`  Supabase Metadata: found ${supabaseFiles.length} files`);
        supabaseFiles.forEach(f => console.log(`    - ${f.display_name} (${f.status}) -> ${f.file_search_file_name}`));

        // 3. Fetch files from Gemini API directly
        try {
            // List files in the store
            // Endpoint: https://generativelanguage.googleapis.com/v1beta/{name=corpora/*}/files or similar for FileSearchStores
            // Actually, for FileSearchStores, files are associated with the store.
            // We can list files in the store using the files endpoint with filter, or getting the store details.
            // Wait, the SDK/API might handle this differently. The service uploads to `v1beta/${storeName}:uploadToFileSearchStore`

            // Let's verify using the query method on the store to see if it returns anything, 
            // OR just check if the files exist via their `files/` endpoint if we know the names.
            // The `file_search_file_name` looks like `files/abc123...`.

            console.log(`  Verifying existence in Google Cloud...`);

            // List all files in the store to see what's actually there
            // Note: The correct endpoint to list files in a store might be different.
            // But let's try getting the store itself first.

            for (const file of supabaseFiles) {
                if (!file.file_search_file_name) {
                    console.log(`    [Skipped] ${file.display_name} has no Gemini ID`);
                    continue;
                }

                console.log(`    Checking specific ID from DB: ${file.file_search_file_name}`);
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/${file.file_search_file_name}?key=${geminiApiKey}`
                );

                if (response.ok) {
                    const geminiFile = await response.json();
                    console.log(`    [OK] ${file.display_name}: Found in Gemini`);
                    console.log(`      Resource Name: ${geminiFile.name}`);
                    console.log(`      State: ${geminiFile.state}`);
                    console.log(`      URI: ${geminiFile.uri}`);
                    // console.log(JSON.stringify(geminiFile, null, 2));

                    // Check if the ID looks like an operation
                    if (file.file_search_file_name.includes('/operations/')) {
                        console.warn(`      WARNING: This ID looks like an Operation ID, not a File ID!`);
                        console.warn(`      This explains why File Search can't find it - it's looking for a file, but we stored the upload receipt.`);
                    }
                } else {
                    console.log(`    [MISSING] ${file.display_name}: Not found in Gemini API (${response.status})`);
                    try {
                        const err = await response.text();
                        console.log('      Response:', err);
                    } catch (e) { }
                }
            }

        } catch (err) {
            console.error(`  Error querying Gemini API:`, err);
        }
    }
}

verifyGeminiFiles();
