
import { generateTTSAudio, uploadTTSToStorage } from '../src/tts/index.js';
import { getSecret } from '../src/utils/secrets.js';

// Mock environment that will load keys from .env or process.env
const mockEnv = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY
};

async function testTTS() {
    console.log("Starting TTS Debug Script...");

    // 1. Mock Analysis Data
    const mockAnalysisId = "debug-test-" + Date.now();
    const lang = "en";
    const text = "This is a test of the Philosify Text to Speech system. It generates philosophical narration.";

    console.log(`Test ID: ${mockAnalysisId}`);

    let audioBuffer;

    try {
        // 2. Test Generation
        console.log("Testing Generation...");
        if (!mockEnv.OPENAI_API_KEY) {
            console.error("Missing OPENAI_API_KEY");
            return;
        }

        audioBuffer = await generateTTSAudio(text, lang, mockEnv);
        console.log(`Audio generated: ${audioBuffer.byteLength} bytes`);

        // 3. Test Storage
        console.log("Testing Upload...");
        if (!mockEnv.SUPABASE_URL || !mockEnv.SUPABASE_SERVICE_KEY) {
            console.error("Missing SUPABASE credentials");
            return;
        }


        const publicUrl = await uploadTTSToStorage(audioBuffer, mockAnalysisId, lang, mockEnv);
        console.log(`SUCCESS! Audio uploaded to: ${publicUrl}`);

    } catch (error) {
        console.log("FAILED to execute test:");
        console.log("Error Message:", error.message);

        // Auto-fix: Create bucket if missing (Supabase sometimes returns 400 for missing bucket)
        if (error.message.includes("Bucket not found") || error.message.includes("404") || error.message.includes("400")) {
            console.log("Attempting to create missing bucket 'tts-audio'...");
            try {
                await createBucket('tts-audio', mockEnv);
                console.log("Bucket created! Retrying upload...");
                const publicUrl = await uploadTTSToStorage(audioBuffer, mockAnalysisId, lang, mockEnv);
                console.log(`SUCCESS! Audio uploaded to: ${publicUrl}`);
            } catch (createError) {
                console.log("Failed to create bucket or retry upload:", createError.message);
            }
        }
    }
}

async function createBucket(bucketName, env) {
    const supabaseUrl = env.SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

    const response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseKey
        },
        body: JSON.stringify({
            name: bucketName,
            public: true,
            file_size_limit: 52428800, // 50MB
            allowed_mime_types: ['audio/mpeg', 'audio/wav']
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Create bucket failed: ${response.status} - ${text}`);
    }
}

testTTS();
