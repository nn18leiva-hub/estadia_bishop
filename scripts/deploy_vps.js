const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();

const HOST = '2.24.85.153';
const USER = 'root';
const PASSWORD = 'Pixiedixie22@';
const REMOTE_DIR = '/root/estadia_bishop';

console.log(`🔌 Connecting to VPS ${USER}@${HOST}...`);

conn.on('ready', () => {
  console.log('✅ SSH Connection Established.');

  const deployScript = `
set -e
echo "=== Step 1: Updating packages & checking prerequisites ==="
if ! command -v git &> /dev/null; then
    apt-get update && apt-get install -y git
fi

if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    apt-get update && apt-get install -y docker-compose
fi

echo "=== Step 2: Preparing Application Directory ==="
if [ -d "${REMOTE_DIR}" ]; then
    echo "Directory ${REMOTE_DIR} exists. Pulling latest code..."
    cd ${REMOTE_DIR}
    git fetch origin main
    git reset --hard origin/main
else
    echo "Cloning repository to ${REMOTE_DIR}..."
    git clone https://github.com/nn18leiva-hub/estadia_bishop.git ${REMOTE_DIR}
    cd ${REMOTE_DIR}
fi

echo "=== Step 3: Setting up Production .env ==="
cat << 'EOF' > ${REMOTE_DIR}/.env
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=Loganito2
DB_NAME=parentportal
PORT=3000
JWT_SECRET=1ed1bceed4f4457ddd561fc9f3d73fb986d64c01f211b2af975cc377e80a9c53097dfffe72e4c62880a8bdc0e54a5a236989907d4d40a3fefc6c58afca8da50a
NODE_ENV=production
ALLOWED_ORIGIN=https://bmhsvirtualoffice.com,http://bmhsvirtualoffice.com,https://www.bmhsvirtualoffice.com,http://www.bmhsvirtualoffice.com,http://${HOST}:8080,http://${HOST},http://localhost:8080
PORTAL_URL=https://bmhsvirtualoffice.com
EOF


echo "=== Step 4: Building & Deploying Docker Containers ==="
cd ${REMOTE_DIR}
if command -v docker-compose &> /dev/null; then
    docker-compose down
    docker-compose up -d --build
else
    docker compose down
    docker compose up -d --build
fi

echo "=== Step 5: Verifying Status ==="
sleep 5
docker ps
curl -s http://localhost:3000/api/health || true
echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
`;

  conn.exec(deployScript, (err, stream) => {
    if (err) {
      console.error('❌ Exec Error:', err);
      conn.end();
      return;
    }
    stream.on('close', (code, signal) => {
      console.log(`\nProcess exited with code ${code}`);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('❌ SSH Connection Failed:', err);
}).connect({
  host: HOST,
  port: 22,
  username: USER,
  password: PASSWORD,
  readyTimeout: 30000
});
