Task 1
Analyze and identify key performance bottlenecks in a Next.js e-commerce application. Propose actionable solutions to significantly improve page load times, development server compilation speed, and overall responsiveness. All existing features must be maintained, and end-to-end integration with the backend must remain robust.

Focus your suggestions on these critical areas, providing concise, actionable advice and relevant Next.js features or best practices:

* **Rendering Strategy Optimization:** Recommend optimal use of SSR, SSG, ISR, and CSR for different e-commerce page types.
* **Image Optimization:** Suggest advanced techniques for efficient product image loading and delivery.
* **Bundle Size Reduction:** Advise on identifying and reducing JavaScript bundle size, including dynamic imports.
* **Data Fetching & Caching:** Provide strategies for efficient server-side and client-side data fetching and caching.
* **Client-side Performance:** Offer methods to minimize component re-renders and improve UI responsiveness.
* **Development Environment (WSL2):** Address WSL2-specific performance considerations for the dev server.
* **General Best Practices:** Include other vital Next.js performance optimizations and monitoring tools.

Prioritize solutions that enhance performance without requiring a feature rewrite or compromising application integrity.


Task 2
I'm facing a persistent issue with my Next.js e-commerce application, displaying two critical errors during development (`npm run dev`) and page access:

1.  **TypeError: Cannot read properties of undefined (reading 'initialColorMode')** at `src/app/layout.tsx:65:56`. This occurs when trying to access `theme.config.initialColorMode`.
2.  **Error [AbortError]: This operation was aborted** at `src/api/products.ts:29:21` during a `fetch` call to my backend API. This error also manifests as "Network or unexpected error fetching products" and "Failed to prefetch products for Home page."

These errors are very stubborn. Please take your time to thoroughly analyze these two distinct but potentially related issues.

**Provide a systematic diagnostic and resolution plan.** Your plan should:

* **Identify the root causes** for both the `TypeError` related to `initialColorMode` and the `AbortError` during API fetching.
* **Propose specific, actionable steps** to debug and fix each problem.
* **Consider potential interdependencies** between the two errors (e.g., if the API `AbortError` causes a server restart leading to the `TypeError`).
* **Suggest how to prevent future occurrences.**
* **Maintain all existing application functionality.**
- Tip you can access this repo in github to track down a potential cause as i incrementally developed since last week i was able to retrive products from the backend without any issue. Therefore this issue has only developed recently with recent improvements.
**Crucially, if you need more information about my codebase (e.g., how `theme` is defined and imported, the full `ColorModeScript` component, the `DJANGO_API_BASE_URL` setup, the `fetchProducts` function, Next.js version, or `next-auth` configuration), please ask specific, targeted questions.** I will provide the necessary details.
