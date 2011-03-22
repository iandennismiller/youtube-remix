
def push():
    cmd = "rsync -av public/* idmiller_idm@ssh.phx.nearlyfreespeech.net:assets/last_call"
    local(cmd, capture=False)