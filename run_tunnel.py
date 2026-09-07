import subprocess
import time
import re
import urllib.request
import threading
import sys
import os

TUNNEL_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tunnel_url.txt')

def keep_alive(url):
    print(f'[KeepAlive] Pinger active for {url}', flush=True)
    while True:
        time.sleep(25)
        try:
            req = urllib.request.Request(
                f'{url}/api/nowcast/cells',
                headers={'User-Agent': 'AetherCast-KeepAlive/1.0'}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                pass
        except Exception:
            pass

def main():
    while True:
        cmd = [
            'ssh',
            '-o', 'StrictHostKeyChecking=no',
            '-o', 'ServerAliveInterval=10',
            '-o', 'ServerAliveCountMax=10',
            '-R', '80:localhost:5173',
            'nokey@localhost.run'
        ]
        print('[Tunnel] Starting localhost.run SSH tunnel...', flush=True)
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            encoding='utf-8',
            errors='replace'
        )

        current_url = None
        pinger_thread = None

        try:
            for line in iter(proc.stdout.readline, ''):
                sys.stdout.write(line)
                sys.stdout.flush()
                match = re.search(r'https://[a-zA-Z0-9\-]+\.lhr\.life', line)
                if match:
                    found_url = match.group(0)
                    if found_url != current_url:
                        current_url = found_url
                        print(f'\n==================================================', flush=True)
                        print(f'  TUNNEL READY: {current_url}', flush=True)
                        print(f'==================================================\n', flush=True)
                        with open(TUNNEL_FILE, 'w', encoding='utf-8') as f:
                            f.write(current_url)
                        
                        if not pinger_thread or not pinger_thread.is_alive():
                            pinger_thread = threading.Thread(target=keep_alive, args=(current_url,), daemon=True)
                            pinger_thread.start()

        except Exception as e:
            print(f'[Tunnel] Error: {e}', flush=True)

        try:
            proc.terminate()
        except Exception:
            pass
        print('[Tunnel] Tunnel exited. Auto-restarting in 2 seconds...', flush=True)
        time.sleep(2)

if __name__ == '__main__':
    main()
