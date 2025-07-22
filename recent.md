#13 [7/9] COPY . /app/
#13 DONE 0.4s
#14 [8/9] COPY entrypoint.sh /usr/local/bin/
#14 DONE 0.2s
#15 [9/9] RUN chmod +x /usr/local/bin/entrypoint.sh
#15 0.052 chmod: changing permissions of '/usr/local/bin/entrypoint.sh': Operation not permitted
#15 ERROR: process "/bin/sh -c chmod +x /usr/local/bin/entrypoint.sh" did not complete successfully: exit code: 1
------
 > [9/9] RUN chmod +x /usr/local/bin/entrypoint.sh:
0.052 chmod: changing permissions of '/usr/local/bin/entrypoint.sh': Operation not permitted
------
Dockerfile:91
--------------------
  89 |     
  90 |     COPY entrypoint.sh /usr/local/bin/
  91 | >>> RUN chmod +x /usr/local/bin/entrypoint.sh
  92 |     ENTRYPOINT ["entrypoint.sh"]
  93 |     
--------------------
error: failed to solve: process "/bin/sh -c chmod +x /usr/local/bin/entrypoint.sh" did not complete successfully: exit code: 1
error: exit status 1
