CREATE TABLE IF NOT EXISTS tasks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  phase ENUM('Estoque', 'Documentação', 'Processos', 'Automações') NOT NULL DEFAULT 'Processos',
  status ENUM('Pendente', 'Em Andamento', 'Concluído') NOT NULL DEFAULT 'Pendente',
  due VARCHAR(100) NOT NULL DEFAULT 'Sem prazo',
  createdAt VARCHAR(100) NOT NULL,
  responsible VARCHAR(150) NOT NULL DEFAULT 'Não atribuída',
  gravidade TINYINT UNSIGNED NOT NULL DEFAULT 3,
  urgencia TINYINT UNSIGNED NOT NULL DEFAULT 3,
  tendencia TINYINT UNSIGNED NOT NULL DEFAULT 3,
  scoreGut SMALLINT UNSIGNED NOT NULL DEFAULT 27,
  tag VARCHAR(150) NOT NULL DEFAULT 'Geral',
  checklist JSON NOT NULL,
  promptIa TEXT NOT NULL,
  observacoes TEXT NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_tasks_status (status),
  INDEX idx_tasks_phase (phase),
  INDEX idx_tasks_scoreGut (scoreGut),
  CONSTRAINT chk_tasks_gravidade CHECK (gravidade BETWEEN 1 AND 5),
  CONSTRAINT chk_tasks_urgencia CHECK (urgencia BETWEEN 1 AND 5),
  CONSTRAINT chk_tasks_tendencia CHECK (tendencia BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS activities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor VARCHAR(100) NOT NULL,
  tone ENUM('teal', 'amber', 'coral') NOT NULL DEFAULT 'teal',
  message VARCHAR(255) NOT NULL,
  taskTitle VARCHAR(255) NOT NULL DEFAULT '',
  time VARCHAR(100) NOT NULL DEFAULT 'Agora',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_activities_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
