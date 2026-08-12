const OUTPUT_METADATA = {
  'offer-generator': { unit: 'commercial offers', shortUnit: 'КП' },
  'technical-specification-generator': { unit: 'technical specifications', shortUnit: 'ТС' },
  'goszakup-parser': { unit: 'runs', shortUnit: 'запуска' },
};

function semanticKey(solution) {
  const name = String(solution?.name || '');
  if (/commercial offer|коммерческ|генератор\s*кп/i.test(name)) return 'offer-generator';
  if (/technical spec|техническ.*специф|генератор\s*тс/i.test(name)) return 'technical-specification-generator';
  if (/goszakup|госзакуп|план\s*гз|парсер/i.test(name)) return 'goszakup-parser';
  return null;
}

function nonNegativeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : fallback;
}

export function getOutputMetrics(solution) {
  const metadata = OUTPUT_METADATA[semanticKey(solution)] || { unit: 'outputs', shortUnit: '' };
  const storedTotal = solution?.outputsTotal ?? (solution?.usageSource === 'tracked' ? solution?.launches : undefined);
  return {
    total: nonNegativeNumber(storedTotal),
    thisMonth: nonNegativeNumber(solution?.outputsThisMonth),
    unit: solution?.outputUnit || metadata.unit,
    shortUnit: solution?.outputShortUnit || metadata.shortUnit,
  };
}

export function formatOutputs(solution) {
  const output = getOutputMetrics(solution);
  return solution?.usageSource === 'tracked'
    ? `${output.total}${output.shortUnit ? ` ${output.shortUnit}` : ''}`
    : '—';
}

export function totalOutputs(solutions = []) {
  return solutions.reduce(
    (sum, solution) => sum + (solution?.usageSource === 'tracked' ? getOutputMetrics(solution).total : 0),
    0,
  );
}

export async function loadRemoteUsage() {
  const response = await fetch('/api/usage', { headers: { Accept: 'application/json' } });
  if (!response.ok) return null;
  const payload = await response.json();
  if (payload.configured === false) return null;
  if (!Array.isArray(payload.rows)) return null;
  return Object.fromEntries(payload.rows.map((row) => [row.solution_id, row]));
}

export function applyRemoteUsage(solutions, usageBySolutionId) {
  if (!usageBySolutionId) return solutions;
  return solutions.map((solution) => {
    const slug = String(solution.name || '').toLowerCase().replaceAll(/[^a-z0-9]+/g, '');
    const key = semanticKey(solution);
    const remote = usageBySolutionId[solution.id] ?? usageBySolutionId[slug] ?? usageBySolutionId[key];
    if (remote == null) return solution;
    const row = typeof remote === 'number' ? { launches: remote } : remote;
    const metadata = getOutputMetrics(solution);
    return {
      ...solution,
      outputsTotal: nonNegativeNumber(row.total ?? row.outputs_total ?? row.launches),
      outputsThisMonth: nonNegativeNumber(row.this_month ?? row.outputs_this_month ?? row.month),
      outputUnit: row.unit || metadata.unit,
      outputShortUnit: row.short_unit || metadata.shortUnit,
      usageSource: 'tracked',
    };
  });
}
