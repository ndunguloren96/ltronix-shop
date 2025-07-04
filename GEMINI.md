Prompt for AI Agent: Frontend TypeError: Body is unusable Fix
Overall Objective:
Resolve the TypeError: Body is unusable: Body has already been read error occurring during server-side prefetching of products on the Next.js home page. This involves modifying the fetch request handling to correctly clone the response object when its body needs to be read multiple times (e.g., for error logging and then JSON parsing).

Core Principles for Agent:

Accuracy and Completeness: Implement the specified change precisely.

Maintain Functionality: Ensure product fetching works correctly.

Robust Error Handling: Ensure the response body is handled correctly for both success and error paths.

Instructions for File Modification:

1. File: frontend/my-app/app/page.js (or page.tsx if TypeScript)
Action: Modify content.

Description: Locate the fetch request that retrieves product data for the home page. This is typically within a server component function (e.g., async function getProducts() or directly in the Page component if it's an async component). Modify the fetch call's response handling to include response.clone() before reading the body for error logging, if that's the pattern being used.

Content Details:

Identify the fetch call: Look for await fetch(...) that targets your product API (likely NEXT_PUBLIC_API_BASE_URL/api/v1/products).

Implement response.clone(): If the code checks response.ok and then potentially reads the body for an error message before attempting response.json(), it must clone the response.

Example of what the problematic and fixed code might look like (AI Agent should adapt to the actual code in page.js):

Original (Problematic) Pattern:

JavaScript

// Example of problematic code in page.js
async function getProducts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/products`);

  if (!res.ok) {
    // Problem: This reads the body, making it unusable for res.json() later
    const errorBody = await res.text();
    console.error('Failed to fetch products:', res.status, errorBody);
    throw new Error('Failed to fetch products');
  }

  // This will fail if res.text() was called above
  return res.json();
}
Corrected Pattern (using response.clone()):

JavaScript

// Corrected code for page.js
async function getProducts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/products`);

  if (!res.ok) {
    // Clone the response BEFORE reading its body for error logging
    const errorResponse = res.clone();
    const errorBody = await errorResponse.text(); // Read from the clone
    console.error('Failed to fetch products:', res.status, errorBody);
    throw new Error(`Failed to fetch products: ${res.status} - ${errorBody}`);
  }

  // Now, the original 'res' can still be read
  return res.json();
}
Alternative (Simpler if only one read is needed):

If you don't need to log the error body before parsing, simply parse it directly:

JavaScript

// Simpler approach if error body logging isn't strictly needed before parsing
async function getProducts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/products`);

  // Parse JSON first, then check status
  const data = await res.json();

  if (!res.ok) {
    console.error('Failed to fetch products:', res.status, data); // Log the parsed error data
    throw new Error(`Failed to fetch products: ${res.status}`);
  }

  return data;
}
The AI agent should identify the fetch call in page.js and apply the response.clone() pattern if it's attempting to read the response body multiple times.


LOGS
vercel
"


{
  "logs": [
    "[2025-07-04 17:53:24 +0300] [7] [ERROR] Exception in worker process",
    "Traceback (most recent call last):",
    "  File \"/usr/local/lib/python3.10/site-packages/gunicorn/arbiter.py\", line 609, in spawn_worker",
    "    worker.init_process()",
    "  File \"/usr/local/lib/python3.10/site-packages/gunicorn/workers/base.py\", line 134, in init_process",
    "    self.load_wsgi()",
    "  File \"/usr/local/lib/python3.10/site-packages/gunicorn/workers/base.py\", line 146, in load_wsgi",
    "    self.wsgi = self.app.wsgi()",
    "  File \"/usr/local/lib/python3.10/site-packages/gunicorn/app/base.py\", line 67, in wsgi",
    "    self.callable = self.load()",
    "  File \"/usr/local/lib/python3.10/site-packages/gunicorn/app/wsgiapp.py\", line 58, in load",
    "    return self.load_wsgiapp()",
    "  File \"/usr/local/lib/python3.10/site-packages/gunicorn/app/wsgiapp.py\", line 48, in load_wsgiapp",
    "    return util.import_app(self.app_uri)",
    "  File \"/usr/local/lib/python3.10/site-packages/gunicorn/util.py\", line 371, in import_app",
    "    mod = importlib.import_module(module)",
    "  File \"/usr/local/lib/python3.10/importlib/__init__.py\", line 126, in import_module",
    "    return _bootstrap._gcd_import(name[level:], package, level)",
    "  File \"<frozen importlib._bootstrap>\", line 1050, in _gcd_import",
    "  File \"<frozen importlib._bootstrap>\", line 1027, in _find_and_load",
    "  File \"<frozen importlib._bootstrap>\", line 1004, in _find_and_load_unlocked",
    "ModuleNotFoundError: No module named 'drf_spectacular'",
    "[2025-07-04 17:53:25 +0300] [7] [INFO] Worker exiting (pid: 7)",
    "Sentry is attempting to send 2 pending events",
    "Waiting up to 2 seconds",
    "[2025-07-04 14:53:26 +0000] [1] [ERROR] Worker (pid:7) exited with code 3",
    "[2025-07-04 14:53:26 +0000] [1] [ERROR] Shutting down: Master",
    "[2025-07-04 14:53:26 +0000] [1] [ERROR] Reason: Worker failed to boot.",
    "[2025-07-04 14:54:24 +0000] [1] [INFO] Starting gunicorn 22.0.0",
    "[2025-07-04 14:54:24 +0000] [1] [INFO] Listening at: http://0.0.0.0:10000 (1)",
    "[2025-07-04 14:54:24 +0000] [1] [INFO] Using worker: sync",
    "[2025-07-04 14:54:24 +0000] [1] [INFO] Booting worker with pid: 7",
    "[2025-07-04 17:54:28 +0300] [7] [ERROR] Exception in worker process",
    "Traceback (most recent call last):",
    "  File \"/usr/local/lib/python3.10/site-packages/gunicorn/arbiter.py\", line 609, in spawn_worker",
    "    worker.init_process()",
    "  File \"/usr/local/lib/python3.10/site-packages/gunicorn/workers/base.py\", line 134, in init_process",
    "    self.load_wsgi()",
    "  File \"/usr/local/lib/python3.10/site-packages/gunicorn/workers/base.py\", line 146, in load_wsgi",
    "    self.wsgi = self.app.wsgi()",
    "  File \"/usr/local/lib/python3.10/site-packages/gunicorn/app/base.py\", line 67, in wsgi",
    "    self.callable = self.load()",
    "  File \"/usr/local/lib/python3.10/site-packages/gunicorn/app/wsgiapp.py\", line 58, in load",
    "    return self.load_wsgiapp()",
    "  File \"/usr/local/lib/python3.10/site-packages/gunicorn/app/wsgiapp.py\", line 48, in load_wsgiapp",
    "    return util.import_app(self.app_uri)",
    "  File \"/usr/local/lib/python3.10/site-packages/gunicorn/util.py\", line 371, in import_app",
    "    mod = importlib.import_module(module)",
    "  File \"/usr/local/lib/python3.10/importlib/__init__.py\", line 126, in import_module",
    "    return _bootstrap._gcd_import(name[level:], package, level)",
    "  File \"<frozen importlib._bootstrap>\", line 1050, in _gcd_import",
    "  File \"<frozen importlib._bootstrap>\", line 1027, in _find_and_load",
    "  File \"<frozen importlib._bootstrap>\", line 1006, in _find_and_load_unlocked",
    "ModuleNotFoundError: No module named 'drf_spectacular'",
    "[2025-07-04 17:54:29 +0300] [7] [INFO] Worker exiting (pid: 7)",
    "[2025-07-04 14:54:30 +0000] [1] [ERROR] Worker (pid:7) exited with code 3",
    "[2025-07-04 14:54:30 +0000] [1] [ERROR] Shutting down: Master",
    "[2025-07-04 14:54:30 +0000] [1] [ERROR] Reason: Worker failed to boot."
  ]
}

"
