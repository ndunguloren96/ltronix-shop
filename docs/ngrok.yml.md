Looks like this in ~/.config/ngrok/ngrok.yml
To open directly from terminal use: ngrok config edit

my actual file:
# ~/.config/ngrok/ngrok.yml



version: 3 # Explicitly declare version 3

authtoken: 2s2vSPqOmKv8yY42nSvG3CO7LAk_6k6DfviYoQBFWSdnUzjAs # Your ngrok authtoken# Define the agent's labels here. This tells the ngrok agent which Cloud Edge(s)

# it should connect its tunnels to.

agent:

    labels:

        - edge=edghts_2xgYgC7djAqMlkLZZvNOLygxNq1 # The edge label for your Ngrok >    authtoken: 2s2vSPqOmKv8yY42nSvG3CO7LAk_6k6DfviYoQBFWSdnUzjAs

tunnels:

    # Define your tunnels normally. They will inherit the agent's labels.

    # Do NOT put 'labels' directly under each tunnel if you're using the agent's l>    django_backend_tunnel:

        addr: 8000 # Your Django backend runs on port 8000

        proto: http

    nextjs_frontend_tunnel:

        addr: 3000 # Your Next.js frontend runs on port 3000

        proto: http

---
# TO run ngrok run these commands:
ngrok start django_backend_tunnel
ngrok start nextjs_frontend_tunnel
ngrok start --all