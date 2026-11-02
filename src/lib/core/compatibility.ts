/** PC configurator compatibility. Only verified component attributes are considered. */

export type ComponentSelection = {
  cpu?: { socket: string; tdpW: number; verified: boolean };
  motherboard?: { socket: string; ramType: string; formFactor: string; verified: boolean };
  ram?: { type: string; verified: boolean };
  gpu?: { lengthMm: number; recommendedPsuW: number; verified: boolean };
  psu?: { wattage: number; verified: boolean };
  case?: { maxGpuLengthMm: number; formFactor: string; verified: boolean };
  cooler?: { supportedSockets: string[]; verified: boolean };
};

export function validateBuild(parts: ComponentSelection): { compatible: boolean; blockers: string[]; warnings: string[] } {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const unverified = Object.entries(parts).filter(([, v]) => v && !v.verified).map(([k]) => k);
  if (unverified.length) warnings.push(`Compatibility cannot be confirmed for unverified parts: ${unverified.join(', ')}.`);

  const { cpu, motherboard, ram, gpu, psu, case: pcCase, cooler } = parts;
  if (cpu?.verified && motherboard?.verified && cpu.socket !== motherboard.socket) blockers.push(`CPU socket ${cpu.socket} does not match motherboard socket ${motherboard.socket}.`);
  if (ram?.verified && motherboard?.verified && ram.type !== motherboard.ramType) blockers.push(`RAM type ${ram.type} does not match motherboard ${motherboard.ramType}.`);
  if (cooler?.verified && cpu?.verified && !cooler.supportedSockets.includes(cpu.socket)) blockers.push(`Cooler does not support socket ${cpu.socket}.`);
  if (gpu?.verified && psu?.verified && psu.wattage < gpu.recommendedPsuW) blockers.push(`PSU ${psu.wattage}W is below the GPU's verified recommended ${gpu.recommendedPsuW}W.`);
  if (gpu?.verified && pcCase?.verified && gpu.lengthMm > pcCase.maxGpuLengthMm) blockers.push(`GPU length ${gpu.lengthMm}mm exceeds case clearance ${pcCase.maxGpuLengthMm}mm.`);
  if (motherboard?.verified && pcCase?.verified && motherboard.formFactor !== pcCase.formFactor && !(pcCase.formFactor === 'ATX' && ['Micro-ATX', 'Mini-ITX'].includes(motherboard.formFactor))) {
    blockers.push(`Motherboard ${motherboard.formFactor} does not fit case ${pcCase.formFactor}.`);
  }
  return { compatible: blockers.length === 0, blockers, warnings };
}
