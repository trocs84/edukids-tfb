import type { NextConfig } from 'next';
const config: NextConfig = { poweredByHeader: false, serverExternalPackages:["@electric-sql/pglite"], async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'same-origin'}]}]}};
export default config;
