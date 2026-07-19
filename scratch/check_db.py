import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('2.24.85.153', port=22, username='root', password='Pixiedixie22@', timeout=15)

def run_query(sql):
    cmd = f'docker exec -t estadia_bishop-db-1 psql -U postgres -d parentportal -c "{sql}"'
    stdin, stdout, stderr = client.exec_command(cmd)
    return stdout.read().decode('utf-8', errors='replace')

print("=== DOCUMENT TYPES IN DB ===")
print(run_query("SELECT document_type_id, name, requires_payment, base_price FROM document_types;"))

print("=== RECENT REQUESTS IN DB ===")
print(run_query("SELECT request_id, parent_id, student_full_name, document_type_id, fee, status, request_date FROM document_requests ORDER BY request_date DESC LIMIT 5;"))

client.close()
