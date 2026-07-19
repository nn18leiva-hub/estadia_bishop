import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('2.24.85.153', port=22, username='root', password='Pixiedixie22@', timeout=15)

stdin, stdout, stderr = client.exec_command('cat /opt/estadia_bishop/.env')
print("=== ENV FILE ===")
print(stdout.read().decode('utf-8', errors='replace'))
client.close()
