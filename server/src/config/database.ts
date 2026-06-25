import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host:               process.env.DB_HOST     ?? 'localhost',
  port:               Number(process.env.DB_PORT ?? 3306),
  database:           process.env.DB_NAME     ?? 'mastrflow',
  user:               process.env.DB_USER     ?? 'mastrflow',
  password:           process.env.DB_PASS     ?? 'mastrflow_pass',
  waitForConnections: true,
  connectionLimit:    20,
  queueLimit:         0,
  // Charset utf8mb4 — soporta ñ, acentos, emojis
  charset:            'utf8mb4',
  timezone:           'local',
});

// Verificar conexión al iniciar
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL conectado (utf8mb4)');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error conectando a MySQL:', err.message);
  });

export default pool;
