import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('2.24.85.153', port=22, username='root', password='Pixiedixie22@', timeout=15)

def run_cmd(cmd):
    stdin, stdout, stderr = client.exec_command(cmd)
    return stdout.read().decode('utf-8', errors='replace') + stderr.read().decode('utf-8', errors='replace')

print("=== SIGNATURES FILES ===")
print(run_cmd('docker exec -t estadia_bishop-api-1 ls -lh /app/uploads/signatures'))

print("=== SSN CARDS FILES ===")
print(run_cmd('docker exec -t estadia_bishop-api-1 ls -lh /app/uploads/ssn_cards'))

print("=== GENERATED DOCUMENTS ===")
print(run_cmd('docker exec -t estadia_bishop-api-1 ls -lh /app/uploads/generated_documents'))

client.close()
