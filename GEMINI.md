Solve this error efficiently, effectively, completely leaving the codebase intergrated, fully functional, synced from end to end. Preserve existing tech, functionalities and designs ie build upon:
"
➜  my-app git:(fix/frontend-errors) npm run dev

> my-app@0.1.0 dev
> NODE_OPTIONS='--max-old-space-size=4096' next dev

   ▲ Next.js 15.3.5
   - Local:        http://localhost:3000
   - Network:      http://172.28.143.206:3000
   - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 25.8s
 ○ Compiling / ...


Retrying 1/3...


Retrying 1/3...


Retrying 1/3...


Retrying 1/3...


Retrying 1/3...


Retrying 1/3...


Retrying 1/3...


Retrying 2/3...


Retrying 3/3...
 ✓ Compiled / in 453.5s (4502 modules)
 ⨯ Error: Attempted to call extendTheme() from the server but extendTheme is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.
    at <unknown> (.next/server/vendor-chunks/@chakra-ui.js:2013:20)
    at eval (src/theme.ts:20:26)
    at <unknown> (rsc)/./src/theme.ts (/home/ndunguloren96/projects/ltronix-shop/frontend/my-app/.next/server/app/page.js:249:1)
    at __webpack_require__ (.next/server/webpack-runtime.js:33:43)
    at eval (webpack-internal:///(rsc)/./src/app/layout.tsx:21:64)
    at <unknown> (rsc)/./src/app/layout.tsx (/home/ndunguloren96/projects/ltronix-shop/frontend/my-app/.next/server/app/page.js:150:1)
    at Function.__webpack_require__ (.next/server/webpack-runtime.js:33:43)
  18 | };
  19 |
> 20 | const theme = extendTheme({
     |                          ^
  21 |   config,
  22 |   colors: {
  23 |     brand: brandColors, {
  page: '/'
}
 ○ Compiling /_error ...

"
