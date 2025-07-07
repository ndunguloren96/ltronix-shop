

   1. Deep Dive into Database Performance:
       * Enable Django Debug Toolbar (if not already): Ensure debug_toolbar is active in your development
         environment. Access the /products/products/ endpoint in your browser and meticulously examine the SQL
          panel.
           * Identify N+1 Queries: Look for repeated queries, especially those fetching Product or related
             Category data.
           * Analyze Query Times: Pinpoint specific queries that are taking a long time.
       * Optimize `Product` Model Queries:
           * `ProductViewSet` Queryset: Modify the queryset in ProductViewSet to use
             select_related('category') if the category name is displayed with each product. If reviews or
             other related objects are displayed, use prefetch_related for reviews or review_set.
           * Custom Managers/Methods: For complex data fetching, consider creating custom Django managers or
             methods on your Product model that pre-fetch all necessary related data in a single, optimized
             query.
       * Add/Verify Database Indexes: Review your store/models.py for the Product model. Ensure that any
         fields frequently used in filter(), order_by(), or exclude() clauses (e.g., name, brand, category_id,
          sku, created_at, updated_at) have database indexes. You already have some, but verify their
         effectiveness.
       * Database Profiling: Use PostgreSQL's EXPLAIN ANALYZE command on slow queries identified by the debug
         toolbar to understand the query execution plan and identify bottlenecks (e.g., full table scans).


   2. Optimize Django REST Framework Serialization:
       * Review `ProductSerializer`:
           * `fields` Optimization: Ensure the fields list in ProductSerializer only includes data strictly
             necessary for the product listing. Remove any fields that are only needed on the product detail
             page.
           * `SerializerMethodField` Review: If get_image_url or any other SerializerMethodField performs
             database lookups, optimize those lookups or consider if the data can be pre-fetched.
       * Pagination: Implement pagination for the product listing API. Even with optimized queries, returning
         thousands of products in a single response will be slow. DRF's PageNumberPagination or
         LimitOffsetPagination can be easily integrated.


   3. Backend Server Environment Tuning:
       * Gunicorn/uWSGI Configuration:
           * Workers: Increase the number of Gunicorn workers. A common recommendation is (2 * CPU_CORES) + 1.
           * Worker Type: Experiment with different worker types (e.g., gevent or meinheld for asynchronous
             workers if your application has I/O bound operations, though sync workers are often sufficient
             for CPU-bound tasks).
           * Timeout: Ensure Gunicorn's timeout is set higher than the frontend's fetch timeout (e.g., 30-60
             seconds) to prevent Gunicorn from killing long-running requests prematurely.
       * Nginx Configuration: If Nginx is used, ensure its proxy_read_timeout, proxy_send_timeout, and
         proxy_connect_timeout are sufficiently high.
       * WSL2 Specifics:
           * File System Location: Confirm your Django project is entirely within the WSL2 filesystem (e.g.,
             /home/ndunguloren96/projects/ltronix-shop) and not mounted from the Windows filesystem, as
             cross-filesystem I/O is significantly slower.
           * Network Configuration: The use of 192.168.68.101 suggests a specific network setup. Ensure there
             are no firewalls or network configurations causing delays between your Windows host and the WSL2
             guest. Consider using localhost or 127.0.0.1 if possible, as it often has lower latency for
             inter-process communication within the same machine.

