import { error, json } from '@sveltejs/kit';
import { exec } from 'child_process';
import { randomBytes } from 'crypto';
import fs from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { promisify } from 'util';
import type { RequestHandler } from './$types';

const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

export const POST: RequestHandler = async ({ request, locals }) => {
    // Check if user is authenticated
    if (!locals.user) {
        throw error(401, 'Unauthorized');
    }
    
    try {
        const { messageId, bitrate = 32 } = await request.json();
        
        if (!messageId) {
            throw error(400, 'Message ID is required');
        }
        
        // Get message from PocketBase
        const message = await locals.pb.collection('messages').getOne(messageId, {
            expand: 'sender'
        });
        
        // Verify the user owns this message
        if (message.expand?.sender?.id !== locals.user.id) {
            throw error(403, 'You can only compress your own messages');
        }
        
        // Download the audio file
        const fileUrl = locals.pb.files.getUrl(message, message.audioFile);
        const response = await fetch(fileUrl);
        const audioBuffer = await response.arrayBuffer();
        
        // Create temporary file
        const tempDir = tmpdir();
        const randomId = randomBytes(8).toString('hex');
        const inputPath = path.join(tempDir, `input_${randomId}.wav`);
        const outputPath = path.join(tempDir, `output_${randomId}.opus`);
        
        // Write audio to temporary file
        await writeFileAsync(inputPath, Buffer.from(audioBuffer));
        
        // Compress audio with ffmpeg
        await execAsync(`ffmpeg -i ${inputPath} -b:a ${bitrate}k -ar 8000 -y ${outputPath}`);
        
        // Read compressed file
        const compressedFile = await readFileAsync(outputPath);
        
        // Create FormData with compressed file
        const formData = new FormData();
        const blob = new Blob([compressedFile], { type: 'audio/opus' });
        formData.append('audioFile', blob, 'compressed_audio.opus');
        
        // Update the message in PocketBase
        await locals.pb.collection('messages').update(messageId, formData);
        
        // Clean up temporary files
        await unlinkAsync(inputPath);
        await unlinkAsync(outputPath);
        
        return json({ success: true });
    } catch (err) {
        console.error('Error compressing audio:', err);
        throw error(500, 'Failed to compress audio');
    }
}; 