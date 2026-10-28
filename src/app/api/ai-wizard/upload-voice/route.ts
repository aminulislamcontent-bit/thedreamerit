// POST /api/ai-wizard/upload-voice - Upload voice file and transcribe using ASR
// Input: multipart/form-data with audio file
// Output: { transcription: string, audioUrl: string }
import { NextRequest } from 'next/server';
import { ok, badRequest, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'content.create' as any)) return forbidden();

  const formData = await req.formData();
  const audioFile = formData.get('audio') as File;

  if (!audioFile) {
    return badRequest('অডিও ফাইল পাওয়া যায়নি');
  }

  // Validate file type
  const validTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/mpeg'];
  if (!validTypes.includes(audioFile.type) && !audioFile.name.match(/\.(webm|mp3|wav|ogg|m4a)$/i)) {
    return badRequest('অগ্রহণযোগ্য ফাইল ফরম্যাট। সাপোর্টেড: webm, mp3, wav, ogg, m4a');
  }

  // Validate file size (max 10MB)
  if (audioFile.size > 10 * 1024 * 1024) {
    return badRequest('ফাইল সাইজ ১০MB এর বেশি হতে পারবে না');
  }

  // Save audio file
  const uploadDir = path.join(process.cwd(), 'uploads', 'voice');
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const fileId = randomUUID();
  const ext = audioFile.name.split('.').pop() || 'webm';
  const fileName = `voice-${fileId}.${ext}`;
  const filePath = path.join(uploadDir, fileName);

  const arrayBuffer = await audioFile.arrayBuffer();
  await writeFile(filePath, Buffer.from(arrayBuffer));

  const audioUrl = `/uploads/voice/${fileName}`;

  // Transcribe using Z.ai ASR
  let transcription = '';
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ZAIModule = require('z-ai-web-dev-sdk');
    const ZAI = ZAIModule.default || ZAIModule;
    const zai = await ZAI.create();

    // Convert audio to base64
    const audioBuffer = Buffer.from(arrayBuffer);
    const base64Audio = audioBuffer.toString('base64');
    const dataUrl = `data:${audioFile.type};base64,${base64Audio}`;

    const asrResponse = await zai.audio.transcriptions.create({
      file: dataUrl,
      model: 'whisper-1',
      language: 'bn', // Bengali
    });

    transcription = asrResponse.text || '';
  } catch (err: any) {
    console.error('ASR failed:', err);
    // Fallback: return empty transcription with note
    transcription = `[ভয়েস ট্রান্সক্রিপশন ব্যর্থ: ${err.message}]`;
  }

  await logAudit({
    userId: user.id,
    action: 'ai_wizard.voice_uploaded',
    entityType: 'User',
    entityId: user.id,
    metadata: { fileName, fileSize: audioFile.size, transcriptionLength: transcription.length },
    ipAddress: getClientIp(req),
  });

  return ok({
    audioUrl,
    transcription,
    duration: 0, // Would extract from audio metadata
  });
});
