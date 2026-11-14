/** Generate responsive WebP derivatives for approved, licensed local product images. */
import { generateDerivatives } from '../src/lib/server/derivatives';

void (async () => {
  const result = await generateDerivatives();
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
