SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- ============================================================
-- Banco de dados: delivery
-- ============================================================

-- -----------------------------------------------------------
-- Tabela administradores (plataforma)
-- -----------------------------------------------------------
CREATE TABLE administradores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100),
  senha VARCHAR(255),
  token VARCHAR(255),
  ip VARCHAR(45)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- Tabela cidades
-- -----------------------------------------------------------
CREATE TABLE cidades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100),
  uf CHAR(2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- Tabela bairros
-- -----------------------------------------------------------
CREATE TABLE bairros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_cidade INT,
  nome VARCHAR(100),
  FOREIGN KEY (id_cidade) REFERENCES cidades(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- Tabela empresas
-- -----------------------------------------------------------
CREATE TABLE empresas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome_empresa VARCHAR(150) NOT NULL,
  endereco VARCHAR(150),
  numero VARCHAR(10),
  email VARCHAR(100),
  senha VARCHAR(255),
  plano_contratado VARCHAR(50),
  horarios_funcionamento TEXT,
  categoria_empresa VARCHAR(100),
  config_gerais TEXT,
  numero_acessos INT DEFAULT 0,
  token VARCHAR(255),
  ip VARCHAR(45)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- Tabela empresa_bairros
-- -----------------------------------------------------------
CREATE TABLE empresa_bairros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa INT,
  id_bairro INT,
  FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON DELETE CASCADE,
  FOREIGN KEY (id_bairro) REFERENCES bairros(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- Tabela categorias de itens
-- -----------------------------------------------------------
CREATE TABLE categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa INT,
  nome VARCHAR(100),
  descricao TEXT,
  FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- Tabela itens
-- -----------------------------------------------------------
CREATE TABLE itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa INT,
  id_categoria INT,
  nome VARCHAR(100),
  descricao TEXT,
  preco DECIMAL(10,2),
  disponibilidade_horarios TEXT,
  img VARCHAR(255),
  numero_pedidos INT DEFAULT 0,
  FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON DELETE CASCADE,
  FOREIGN KEY (id_categoria) REFERENCES categorias(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- Tabela usuários
-- -----------------------------------------------------------
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100),
  email VARCHAR(100),
  id_bairro INT,
  cpf VARCHAR(14),
  numero VARCHAR(20),
  senha VARCHAR(255),
  token VARCHAR(255),
  ip VARCHAR(45),
  nivel_usuario TINYINT DEFAULT 0 COMMENT '0=cliente,1=admin_loja,2=admin_plataforma',
  id_empresa INT DEFAULT NULL COMMENT 'Para admin de loja',
  FOREIGN KEY (id_bairro) REFERENCES bairros(id) ON DELETE SET NULL,
  FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- Tabela pedidos
-- -----------------------------------------------------------
CREATE TABLE pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa INT,
  id_usuario INT,
  total DECIMAL(10,2),
  status VARCHAR(50),
  data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_empresa) REFERENCES empresas(id),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- Tabela pedido_itens
-- -----------------------------------------------------------
CREATE TABLE pedido_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido INT,
  id_item INT,
  quantidade INT,
  preco_unitario DECIMAL(10,2),
  FOREIGN KEY (id_pedido) REFERENCES pedidos(id),
  FOREIGN KEY (id_item) REFERENCES itens(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- Tabela comentários de empresas
-- -----------------------------------------------------------
CREATE TABLE comentarios_empresa (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa INT,
  id_usuario INT,
  comentario TEXT,
  estrelas TINYINT COMMENT '1 a 5',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- Tabela stories das empresas
-- -----------------------------------------------------------
CREATE TABLE stories_empresa (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa INT,
  imagem_url VARCHAR(255),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_empresa) REFERENCES empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- Tabela publicações de clientes (somente se existir pedido)
-- -----------------------------------------------------------
CREATE TABLE publicacoes_cliente (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido INT,
  id_usuario INT,
  imagem_url VARCHAR(255),
  descricao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  aprovado BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;