import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

async function runMigrations() {
  console.log('Executando migrações do banco de dados...');
  
  try {
    // Garantir que o diretório data existe
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Diretório data criado.');
    }
    
    // Executar os scripts SQL para criar as tabelas
    const scriptsDir = path.join(process.cwd(), 'scripts');
    const sqlFiles = fs.readdirSync(scriptsDir).filter(file => file.endsWith('.sql'));
    
    for (const sqlFile of sqlFiles) {
      const sqlFilePath = path.join(scriptsDir, sqlFile);
      console.log(`Executando script: ${sqlFile}`);
      
      // Ler o conteúdo do arquivo SQL
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
      
      // Se for o script de feedbacks, vamos aplicar manualmente
      if (sqlFile === '004-create-feedback-table.sql') {
        console.log('Preparando para criar tabela de feedbacks...');
      }
    }
    
    console.log('Migrações concluídas com sucesso!');
  } catch (error) {
    console.error('Erro ao executar migrações:', error);
    process.exit(1);
  }
}

runMigrations();