import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const license=(file)=>fs.readFileSync(path.join(root,'vendor',file),'utf8');
const text=`# Third-party notices\n\n## D3 7.9.0\n\nSource: https://github.com/d3/d3/tree/v7.9.0\nDistribution: https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js\nLicense: ISC. The bundled distribution includes D3 submodules.\n\n${license('D3-LICENSE')}\n\n## World country geometry\n\nSource package: @d3-maps/atlas 1.0.0, world/countries/countries-110m\nOriginal source: https://esm.sh/@d3-maps/atlas@1.0.0/world/countries/countries-110m\nConverted from published TopoJSON to GeoJSON, preserving the published country geometry and ISO3 identifiers.\nPackage license: MIT. Underlying Natural Earth geographic data: public domain (https://www.naturalearthdata.com/about/terms-of-use/).\n\n${license('ATLAS-LICENSE')}\n`;
fs.writeFileSync(path.join(root,'THIRD_PARTY_NOTICES.md'),text);
