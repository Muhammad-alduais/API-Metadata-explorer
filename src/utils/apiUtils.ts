/**
 * Split a Census API request with N variables into multiple requests (max varLimit vars each)
 * 
 * @param url - The original API URL with all variables
 * @param varLimit - Maximum number of variables per request (default 10)
 * @returns An array of split URLs
 */
export function splitCensusApiRequest(url: string, varLimit: number = 10): string[] {
  // Match base, get vars, and other params
  const match = url.match(/^(.*\?get=)([^&]+)(.*)$/i);
  if (!match) return [url]; // Not a valid Census API get request

  const base = match[1]; // up to '?get='
  const vars = match[2].split(',').map(v => v.trim()).filter(Boolean);
  const rest = match[3] || ''; // e.g., '&time=2013-01'

  const result: string[] = [];
  for (let i = 0; i < vars.length; i += varLimit) {
    const chunk = vars.slice(i, i + varLimit);
    result.push(`${base}${chunk.join(',')}${rest}`);
  }
  
  return result.length > 0 ? result : [url];
}

/**
 * Calculate total number of variables from the metadata
 * 
 * @param data - The API metadata
 * @returns The total number of variables
 */
export function calculateTotalVariables(data: any): number {
  if (!data || !data.dataset || !Array.isArray(data.dataset)) {
    return 0;
  }
  
  let totalVars = 0;
  for (const dataset of data.dataset) {
    // Estimate based on the variables property if available
    if (dataset.variables && Array.isArray(dataset.variables)) {
      totalVars += dataset.variables.length;
    } else {
      // Use a rough estimate if variable count isn't available
      totalVars += 15; // Arbitrary estimate
    }
  }
  
  return totalVars;
}