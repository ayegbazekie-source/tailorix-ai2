import { handleDeconstructRequest } from '../server/deconstructGateway';

async function run() {
  console.log('Testing Groq gateway...');
  const groqRes = await handleDeconstructRequest({
    provider: 'groq',
    userInstruction: 'Make the thigh 2 inches wider and remove the back pocket',
  });
  console.log('Groq Response:', JSON.stringify(groqRes, null, 2));

  console.log('\nTesting Gemini gateway with 1x1 transparent PNG...');
  // 1x1 white png base64
  const whitePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  const geminiRes = await handleDeconstructRequest({
    provider: 'gemini',
    images: [{ id: 'img_test_01', role: 'front', data: whitePng }],
  });
  console.log('Gemini Response success:', geminiRes.success);
  console.log('Gemini Garment Type:', geminiRes.specification?.identity?.garmentType || geminiRes.specification?.garmentType);
  console.log('Gemini Confidence:', geminiRes.confidence);
}

run().catch(console.error);
