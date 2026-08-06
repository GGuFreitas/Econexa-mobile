CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL, -- Guardará o Hash criptografado
    role VARCHAR(50) NOT NULL DEFAULT 'citizen', -- 'citizen', 'specialist', 'organization'
    peso_voto INTEGER NOT NULL DEFAULT 1, -- Cidadão = 1, Especialista = 3
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);