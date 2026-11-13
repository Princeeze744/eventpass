import type { NextConfig } from "next";

/* ------------------------------------------------------------------
   Security headers.

   This file was empty, which means every response went out with
   browser defaults. These cost nothing, break nothing, and close a
   row of small doors at once.

   A full Content-Security-Policy is deliberately NOT here. It is the
   strongest header of the set and also the one that silently breaks
   a working site - Next's inline scripts, the Vercel Blob images,
   the Google fonts all have to be allowed by name. That is worth
   doing carefully on its own, not bundled into a quiet afternoon.
------------------------------------------------------------------ */
const securityHeaders = [
  /* tell browsers to only ever reach this site over HTTPS, for two
     years, subdomains included - after which a plain http:// link
     cannot be used to intercept anything */
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },

  /* stop the browser second-guessing a file's type. Without it an
     upload declared as an image but containing markup can be served
     as markup, and that is a script running on our origin */
  { key: "X-Content-Type-Options", value: "nosniff" },

  /* nobody should be putting a guest's pass inside their own page */
  { key: "X-Frame-Options", value: "SAMEORIGIN" },

  /* a pass URL contains a pass ID. Sending that to every site a guest
     clicks through to would be handing out credentials in a header */
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  /* the scanner needs the camera. Nothing on this site needs a
     microphone, a location or a payment handler */
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=(), interest-cohort=()",
  },

  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  /* a header a browser never sees is worth nothing, so these go on
     every route rather than on the pages we happened to think of */
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
