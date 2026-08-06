# Arquitetura do Mutira

Este documento organiza a estrutura do projeto de forma simples, com foco em MVP, separação de responsabilidades e crescimento controlado.

## 1. Objetivo da arquitetura

A arquitetura precisa apoiar quatro coisas principais:
- cadastro de problemas pela população;
- apoio comunitário a esses problemas;
- organização de mutirões e eventos;
- login e perfis com regras claras.

A ideia é manter o sistema enxuto, sem criar camadas desnecessárias antes da hora.

## 2. Princípios principais

1. Simplicidade primeiro.
2. O backend concentra a regra de negócio.
3. O mobile só exibe e dispara ações.
4. Cada módulo tem uma responsabilidade clara.
5. Fila e cron servem para processos assíncronos, não para esconder problemas de estrutura.
6. Evitar overengineering: começar com poucos módulos e expandir apenas quando houver necessidade real.

## 3. Visão geral do sistema

```text
Mobile / App
  └── Backend API
        ├── Auth
        ├── Problems
        ├── Supports
        ├── Mutirões
        ├── Events
        └── Notifications
```

## 4. Separação de responsabilidades

### Frontend mobile
Responsável por:
- interface do usuário;
- navegação;
- formulário de cadastro;
- exibição de mapa e listas;
- chamada para a API.

### Backend
Responsável por:
- autenticação;
- validação de regras;
- persistência dos dados;
- permissões básicas;
- fila e cron;
- notificações simples.

## 5. Estrutura recomendada por módulo

### Frontend
```text
src/modules/{modulo}/
├── api/
├── hooks/
├── pages/
└── components/
```

### Backend
```text
src/modules/{modulo}/
├── {modulo}.controller.ts
├── {modulo}.repository.ts
└── services/
    ├── Create{Modulo}.service.ts
    ├── Update{Modulo}.service.ts
    └── List{Modulo}.service.ts
```

## 6. Módulos iniciais recomendados

### Auth
- login
- cadastro
- recuperação de senha
- perfil básico
- papéis simples

### Problems
- criar problema
- listar problemas próximos
- apoiar problema
- atualizar status básico

### Supports
- registrar apoio da comunidade
- contar apoios
- evitar duplicidade simples

### Mutirões
- criar ação comunitária
- confirmar presença
- listar mutirões próximos

### Events
- criar evento local
- listar eventos próximos
- inscrição simples

## 7. Regras de autenticação e perfis

Comece com um modelo simples:
- usuário
- perfil
- papel

Papéis iniciais:
- cidadão
- organizador
- moderador
- admin

A regra de permissões pode ser simples no início:
- cidadão registra e apoia;
- organizador cria mutirões e eventos;
- moderador revisa conteúdos;
- admin gerencia o sistema.

Não é necessário começar com um sistema de permissões muito fino.

## 8. Fila e cron

### Fila
Use fila para tarefas assíncronas, como:
- compressão de imagem;
- envio de notificação após ação relevante;
- processamento posterior de dados.

### Cron
Use cron para tarefas recorrentes, como:
- lembrete de mutirões;
- resumo diário de problemas ativos;
- limpeza de dados temporários.

Regra prática:
- se a tarefa não precisa bloquear a resposta do usuário, ela vai para fila ou cron.

## 9. Como evitar overengineering

Evite:
- criar um módulo novo para cada pequena ação;
- criar dezenas de arquivos de utilidade antes do MVP;
- adicionar integrações complexas demais cedo;
- exagerar em permissões e regras de negócio antes do sistema funcionar bem.

## 10. Caminho recomendado para o MVP

1. Autenticação simples com perfil básico.
2. Cadastro de problemas com localização.
3. Apoio comunitário.
4. Mutirões básicos.
5. Eventos básicos.
6. Notificações simples.

Esse caminho entrega o coração do projeto sem perder velocidade.
export function MapPage() {
  // Simulação de coordenada atual do celular (São Paulo)
  const [currentRegion] = useState({ latitude: -23.5505, longitude: -46.6333 });
  const [clickedCoords, setClickedCoords] = useState(currentRegion);

  // Injeção do nosso Custom Hook
  const { problems, loadingMap, registerProblem, isSaving } = useProblems(currentRegion.latitude, currentRegion.longitude);

  if (loadingMap) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          ...currentRegion,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03
        }}
        onPress={(e) => setClickedCoords(e.nativeEvent.coordinate)}
      >
        {/* Marcador móvel do usuário para registrar novo ponto */}
        <Marker coordinate={clickedCoords} pinColor="blue" title="Onde está o problema?" />

        {/* RENDERIZAÇÃO AUTOMÁTICA DOS PINS QUE VÊM DO BANCO POSTGIS */}
        {problems.map((prob: any) => (
          <Marker
            key={prob.id}
            coordinate={{ latitude: prob.lat, longitude: prob.lng }}
            pinColor={prob.status === 'resolved' ? 'green' : 'red'}
            title={prob.title}
            description={prob.description}
          />
        ))}
      </MapView>

      {/* Formulário do rodapé acelerado com Formik */}
      <View style={styles.card}>
        <Formik
          initialValues={{ title: '', description: '' }}
          onSubmit={(values, { resetForm }) => {
            registerProblem({ ...values, lat: clickedCoords.latitude, lng: clickedCoords.longitude });
            resetForm();
          }}
        >
          {({ handleChange, handleSubmit, values }) => (
            <View>
              <TextInput style={styles.input} placeholder="Título do Problema" onChangeText={handleChange('title')} value={values.title} />
              <Button title={isSaving ? "Gravando..." : "Registrar no Mutira"} onPress={() => handleSubmit()} />
            </View>
          )}
        </Formik>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 2 },
  card: { flex: 1, backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
Use o código com cuidado.Para que possamos ver este fluxo completo rodando perfeitamente nas duas pontas, o que gostaria de fazer a seguir:No Back-end: Criar a tabela problems com a coluna do tipo GEOMETRY no PostgreSQL para que as consultas SQL puras comecem a funcionar?No Front-end Mobile: Configurar o arquivo principal App.tsx injetando o QueryClientProvider para que o aplicativo mobile consiga ativar os Hooks do TanStack Query?