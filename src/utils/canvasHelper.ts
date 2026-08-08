export function oklabToRgb(oklabStr: string): string {
  try {
    const match = oklabStr.match(/oklab\(\s*([\d.-]+%?)[,\s]+([\d.-]+)[,\s]+([\d.-]+)(?:\s*[\s/,\s]\s*([\d.-]+%?))?\s*\)/i);
    if (!match) return 'rgb(79, 70, 229)';

    let L = match[1].endsWith('%') ? parseFloat(match[1]) / 100 : parseFloat(match[1]);
    let aVal = parseFloat(match[2]);
    let bVal = parseFloat(match[3]);
    let A = match[4] ? (match[4].endsWith('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4])) : 1;

    const l = L + 0.3963377774 * aVal + 0.2158037573 * bVal;
    const m = L - 0.1055613458 * aVal - 0.0638541728 * bVal;
    const s = L - 0.0894841775 * aVal - 1.2914855480 * bVal;

    const l3 = l * l * l;
    const m3 = m * m * m;
    const s3 = s * s * s;

    let rLinear = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    let gLinear = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    let bLinear = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076282910 * s3;

    const f = (c: number) => {
      const abs = Math.abs(c);
      const res = abs <= 0.0031308 ? 12.92 * abs : 1.055 * Math.pow(abs, 1 / 2.4) - 0.055;
      return c < 0 ? -res : res;
    };

    const r = Math.round(Math.max(0, Math.min(1, f(rLinear))) * 255);
    const g = Math.round(Math.max(0, Math.min(1, f(gLinear))) * 255);
    const b = Math.round(Math.max(0, Math.min(1, f(bLinear))) * 255);

    if (A === 1) {
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      return `rgba(${r}, ${g}, ${b}, ${A})`;
    }
  } catch (e) {
    return 'rgb(79, 70, 229)';
  }
}

export function oklchToRgb(oklchStr: string): string {
  try {
    const match = oklchStr.match(/oklch\(\s*([\d.-]+%?)[,\s]+([\d.-]+)[,\s]+([\d.-]+)(?:\s*[\s/,\s]\s*([\d.-]+%?))?\s*\)/i);
    if (!match) return 'rgb(79, 70, 229)';

    let L = match[1].endsWith('%') ? parseFloat(match[1]) / 100 : parseFloat(match[1]);
    let C = parseFloat(match[2]);
    let H = parseFloat(match[3]);
    let A = match[4] ? (match[4].endsWith('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4])) : 1;

    const hRad = (H * Math.PI) / 180;
    const aVal = C * Math.cos(hRad);
    const bVal = C * Math.sin(hRad);

    const l = L + 0.3963377774 * aVal + 0.2158037573 * bVal;
    const m = L - 0.1055613458 * aVal - 0.0638541728 * bVal;
    const s = L - 0.0894841775 * aVal - 1.2914855480 * bVal;

    const l3 = l * l * l;
    const m3 = m * m * m;
    const s3 = s * s * s;

    let rLinear = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    let gLinear = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    let bLinear = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076282910 * s3;

    const f = (c: number) => {
      const abs = Math.abs(c);
      const res = abs <= 0.0031308 ? 12.92 * abs : 1.055 * Math.pow(abs, 1 / 2.4) - 0.055;
      return c < 0 ? -res : res;
    };

    const r = Math.round(Math.max(0, Math.min(1, f(rLinear))) * 255);
    const g = Math.round(Math.max(0, Math.min(1, f(gLinear))) * 255);
    const b = Math.round(Math.max(0, Math.min(1, f(bLinear))) * 255);

    if (A === 1) {
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      return `rgba(${r}, ${g}, ${b}, ${A})`;
    }
  } catch (e) {
    return 'rgb(79, 70, 229)';
  }
}

export function replaceOklabAndOklch(str: string): string {
  return str
    .replace(/oklch\([^)]+\)/gi, (m) => oklchToRgb(m))
    .replace(/oklab\([^)]+\)/gi, (m) => oklabToRgb(m));
}

export async function captureCanvasSafely(element: HTMLElement, options: any = {}) {
  // Temporary arrays to hold original styles so we can revert them
  const revertStyles: Array<{ el: HTMLElement, prop: string, val: string, priority: string }> = [];

  try {
    // Collect and override oklch/oklab styles on the original elements directly
    // This avoids needing to patch native APIs which causes Illegal constructor errors
    const originalElements = [element, ...Array.from(element.querySelectorAll('*'))] as HTMLElement[];
    const props = ['color', 'background-color', 'border-color', 'text-decoration-color', 'fill', 'stroke', 'background-image'];
    
    originalElements.forEach(el => {
      if (!el.style) return; // Skip text nodes etc if they somehow got in
      const compStyle = window.getComputedStyle(el);
      
      props.forEach(prop => {
        const val = compStyle.getPropertyValue(prop);
        if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
          // Save original inline style
          revertStyles.push({ 
            el, 
            prop, 
            val: el.style.getPropertyValue(prop),
            priority: el.style.getPropertyPriority(prop)
          });
          // Set new computed rgb style
          el.style.setProperty(prop, replaceOklabAndOklch(val), 'important');
        }
      });
    });

    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      ...options
    });
    
    return canvas;
  } finally {
    // Revert all temporary inline styles
    revertStyles.forEach(({ el, prop, val, priority }) => {
      if (val) {
        el.style.setProperty(prop, val, priority);
      } else {
        el.style.removeProperty(prop);
      }
    });
  }
}
