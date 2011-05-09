from fabric.api import env, run, local
import os

def server():
    os.system("python dev/server.py")
