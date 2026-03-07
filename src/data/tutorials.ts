import { Tutorial } from '../types';

export const defaultTutorials: Tutorial[] = [
  {
    id: '1',
    title: 'Onboarding Pessoa Física',
    description: 'Guia passo a passo para primeiro acesso, biometria e perfil de investidor.',
    category: 'Onboarding',
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-1',
        title: 'Baixar os Aplicativos',
        content: `
Para iniciar o seu relacionamento com a Elitte Capital, você precisará baixar os aplicativos necessários para gerenciar seus investimentos e sua conta bancária.

**1. BTG Pactual Investimentos (ou Necton Investimentos)**
Este aplicativo é utilizado para acompanhar sua carteira de investimentos, realizar aplicações e resgates.
*   [App Store (iOS)](https://apps.apple.com/br/app/btg-pactual-investimentos/id1042623543)
*   [Google Play (Android)](https://play.google.com/store/apps/details?id=br.com.btgpactual.digital&hl=pt_BR)

**2. BTG Banking**
Este aplicativo é utilizado para movimentações bancárias, pagamentos e transferências.
*   [App Store (iOS)](https://apps.apple.com/br/app/btg-banking/id1449646664)
*   [Google Play (Android)](https://play.google.com/store/apps/details?id=com.btg.pactual.banking&hl=pt_BR)
        `
      },
      {
        id: 'step-2',
        title: 'Primeiro Acesso e Biometria',
        content: `
Após baixar o aplicativo, siga os passos abaixo para realizar o seu primeiro acesso e cadastrar sua biometria facial. Isso garante a segurança da sua conta.

1.  Abra o aplicativo e clique em **"Entrar"**.
2.  Insira seu **CPF** e clique em **"Continuar"**.
3.  Você receberá um link por SMS ou E-mail. Clique no link para iniciar a validação.
4.  Clique em **"Verificar com a Único"**.
5.  Siga as instruções na tela para tirar uma **selfie**.
    *   Procure um local bem iluminado.
    *   Não use óculos, chapéu ou máscara.
    *   Enquadre seu rosto na marcação indicada.
6.  Aguarde a validação. Se tudo estiver correto, você verá a mensagem **"Solicitação finalizada"**.
        `
      },
      {
        id: 'step-3',
        title: 'Assinatura da Ficha Cadastral',
        content: `
Após a validação biométrica, você precisará assinar digitalmente a sua ficha cadastral.

1.  Verifique seu e-mail. Você receberá uma mensagem da **Clicksign**.
2.  Abra o e-mail e clique em **"Visualizar para assinar"**.
3.  Revise os seus dados na ficha cadastral.
4.  Clique em **"Assinar"**.
5.  Preencha seu **Nome Completo**, **CPF** e **Data de Nascimento**.
6.  Clique em **"Avançar"**.
7.  Você receberá um **Token** por e-mail ou SMS.
8.  Insira o Token no campo indicado e clique em **"Finalizar"**.

Pronto! Sua conta estará em processo de ativação.
        `
      },
      {
        id: 'step-4',
        title: 'Preenchimento do Perfil de Investidor (Suitability)',
        content: `
Para que possamos recomendar os melhores investimentos para você, é obrigatório o preenchimento do Perfil de Investidor.

1.  Acesse o aplicativo **BTG Pactual Investimentos**.
2.  Faça login na sua conta.
3.  No menu principal ou clicando na sua foto/iniciais no canto superior esquerdo, procure por **"Perfil de Investidor"**.
4.  Clique em **"Responder Questionário"** ou **"Definir Perfil"**.
5.  Responda às perguntas sobre seus objetivos, horizonte de tempo e tolerância a risco.
6.  Ao final, seu perfil será definido como **Conservador**, **Moderado** ou **Sofisticado**.

*Nota: Você pode refazer este teste a qualquer momento caso seus objetivos mudem.*
        `
      }
    ]
  },
  {
    id: '2',
    title: 'Abertura de Conta Internacional',
    description: 'Como abrir sua conta de investimentos no exterior.',
    category: 'Internacional',
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-1',
        title: 'Acessar Menu Internacional',
        content: `
1.  Acesse o App BTG Pactual Investimentos.
2.  No menu inferior, clique em **"Menu"** > **"Contas Internacionais"**.
3.  Selecione a opção **"Investimentos"** ou **"Banking"** conforme seu interesse.
        `
      },
      {
        id: 'step-2',
        title: 'Confirmar Dados e Perfil',
        content: `
1.  Clique em **"Abrir Agora"**.
2.  Confirme seus dados pessoais (Nome, CPF, Data de Nascimento).
3.  Responda às perguntas sobre seu patrimônio e objetivos no exterior.
4.  Informe seu tempo de experiência com investimentos internacionais.
        `
      },
      {
        id: 'step-3',
        title: 'Termos e Biometria',
        content: `
1.  Leia e aceite os termos de uso da conta internacional.
2.  Será necessário realizar uma nova validação biométrica (selfie) e foto do documento (RG ou CNH).
3.  Siga as instruções na tela para capturar as imagens.
4.  Aguarde a análise. Você será notificado assim que a conta for aberta.
        `
      }
    ]
  },
  {
    id: '3',
    title: 'Migração de Contas - PF e PJ Via Portal Admin',
    description: 'Instruções para efetuar a troca de assessoria de contas PF e PJ através do Portal Admin.',
    category: 'Operacional',
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-1',
        title: 'Acesse o Portal Admin',
        content: `
1. Acesse o Portal Admin, no menu lateral selecione a opção **"Onboarding"** e em seguida clique em **"Migração de Contas"** para formalizar sua solicitação.
2. Informe o CPF do cliente, o número da conta e clique em **"Buscar"**.

*Nota: Não há migração para contas que são do segmento Corban via Portal Admin.*
        `,
        image: 'https://placehold.co/600x400?text=Portal+Admin+-+Onboarding'
      },
      {
        id: 'step-2',
        title: 'Migração com Perfil de Acesso Completo',
        content: `
1. Preencha as **"Informações futuras da conta"** com os dados do escritório, dados do assessor e clique em **"Continuar"**.
2. Em seguida aparecerá um banner com as alterações solicitadas. Estando tudo correto, selecione como deseja notificar o cliente: **"Via Push/notificação"** (via app) ou **"Via documento no Clicksign"** (via e-mail).
3. Clique em **"Finalizar"**.

Pronto! A solicitação de migração de conta foi enviada para aceite do cliente.
        `,
        image: 'https://placehold.co/600x400?text=Migracao+Acesso+Completo'
      },
      {
        id: 'step-3',
        title: 'Migração com Perfil de Acesso Consulta',
        content: `
1. Preencha as **"Informações futuras da conta"** com os dados do escritório, dados do assessor e clique em **"Continuar"**.
2. Em seguida aparecerá um banner com as alterações solicitadas. Estando tudo correto, selecione a opção **"Via documento no Clicksign"** (via e-mail) para notificar o cliente.
3. Clique em **"Finalizar"**.

Pronto! A solicitação de migração de conta foi enviada para aceite do cliente.
        `,
        image: 'https://placehold.co/600x400?text=Migracao+Acesso+Consulta'
      },
      {
        id: 'step-4',
        title: 'Acompanhar Migração',
        content: `
1. Para acompanhar a solicitação e o encaminhamento da migração, clique na aba **"Acompanhamento"**, informe o número da conta e clique em **"Filtrar"**.
2. Clique no ícone **"+"** para visualizar o status atual da solicitação.

**Importante:** O prazo de 48 horas úteis para migração só começará a valer a partir do momento em que o cliente realizar o aceite via Push ou Clicksign.
        `,
        image: 'https://placehold.co/600x400?text=Acompanhar+Migracao'
      }
    ]
  },
  {
    id: '4',
    title: 'Abertura de Conta Kids Via APP',
    description: 'Instruções para efetuar abertura de conta Kids via APP.',
    category: 'Abertura de Conta',
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-1',
        title: 'Acesse o APP da Conta Investimentos',
        content: `
*Vale lembrar que para seguir com a abertura da conta o representante legal já deve ter conta conosco.*

1. Acesse o APP, vá em **"Meu perfil"** localizado no ícone com a inicial do seu nome no lado superior esquerdo da tela.
2. Em seguida, clique em **"Gestão de contas BTG"**.
3. A seguir, selecione o campo **"Criar nova conta"**.
        `,
        image: 'https://placehold.co/600x400?text=Acesso+App+Investimentos'
      },
      {
        id: 'step-2',
        title: 'Realizar Biometria e Informar Titularidade',
        content: `
1. Na tela seguinte, o representante deverá seguir com a realização da biometria e em seguida basta clicar em **"Estou pronto"**.
2. Se o menor tiver menos de 8 anos, selecione **"Não, quero abrir apenas uma conta investimento"**.
3. Em seguida, clique em **"Não, sou representante legal"**.

**Pontos Importantes:**
* Caso o menor tenha mais de 8 anos, o representante poderá solicitar a abertura de conta Kids no Banking também.
* Se o menor tiver menos de 8 anos, mesmo que o representante escolha as duas, só irá abrir a conta investimentos.
        `,
        image: 'https://placehold.co/600x400?text=Biometria+e+Titularidade'
      },
      {
        id: 'step-3',
        title: 'Informe a Assessoria e Inicie a Abertura',
        content: `
1. Caso já possua um assessor, selecione a opção **"Quero escolher assessor ou assessora"** e insira o CGE ou nome do mesmo. Caso não possua, clique na opção **"Quero que o BTG escolha para mim"**.
2. Informe o **CPF** da criança ou adolescente.
3. Informe se o menor é emancipado e selecione **"Sim ou Não"**.
        `,
        image: 'https://placehold.co/600x400?text=Informe+Assessoria'
      },
      {
        id: 'step-4',
        title: 'Confirmação de Dados',
        content: `
1. Informe se você é **Pai/Mãe** ou **Responsável legal**.
2. Caso seja responsável legal do menor, realize o upload do documento que comprove a responsabilidade legal perante a criança.
3. Informe o **nome completo** do menor.
        `,
        image: 'https://placehold.co/600x400?text=Confirmacao+Dados'
      },
      {
        id: 'step-5',
        title: 'Informações Cadastrais do Menor',
        content: `
1. Informe o **e-mail** do menor.
2. Informe a **data de nascimento** do menor.
3. Informe o **celular** do menor.
        `,
        image: 'https://placehold.co/600x400?text=Infos+Cadastrais+Menor'
      },
      {
        id: 'step-6',
        title: 'Informações Cadastrais e Endereço',
        content: `
1. Informe o nome do pai/mãe ou representante legal do menor.
2. Na tela seguinte, informe o país de nascimento e dados de endereço do menor.
3. Informe qual documento do menor será enviado.
        `,
        image: 'https://placehold.co/600x400?text=Endereco+e+Documento'
      },
      {
        id: 'step-7',
        title: 'Finalizando a Abertura',
        content: `
1. Realize o upload do documento escolhido.
2. Em seguida leia e aceite os Termos e Condições de Uso e selecione o campo **"Continuar"**.

Pronto! Solicitação de abertura enviada! Assim que aprovada, você será notificado.
        `,
        image: 'https://placehold.co/600x400?text=Finalizando+Abertura'
      }
    ]
  },
  {
    id: '5',
    title: 'Emissão de Bilhete de Seguros (Mastercard)',
    description: 'Passo a passo para emissão de Bilhete de Seguro Viagem e outros benefícios Mastercard.',
    category: 'Seguros',
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-1',
        title: 'Acesso ao Portal AIG',
        content: `
1. Acesse o site [www.aig.com/mastercard](http://www.aig.com/mastercard).
2. Para alterar o idioma, vá até o final da página e selecione "Português".
3. Os seguros que exigem emissão de Bilhete são: **MasterSeguro de Viagem** e **Garantia Estendida Original**.
        `,
        image: 'https://placehold.co/600x400?text=Portal+AIG'
      },
      {
        id: 'step-2',
        title: 'Login e Cadastro',
        content: `
1. Insira o número do cartão completo.
2. Preencha o Captcha.
3. Insira o CPF do portador e E-mail.
4. Aceite os termos e condições e clique em **"Seguinte"**.
5. Leia atentamente o pop-up e clique em **"Ok"**.
        `,
        image: 'https://placehold.co/600x400?text=Login+Cadastro'
      },
      {
        id: 'step-3',
        title: 'Emissão do Bilhete',
        content: `
1. Para emitir o Bilhete de Seguro Viagem, clique em **"Saiba Mais"** no cartão correspondente ao benefício.
2. Um pop-up abrirá com as opções:
    *   **Novo Certificado:** Para emitir um novo bilhete.
    *   **Ver Certificados:** Para acessar histórico ou reenviar.
    *   **Nova Compra:** Para comprar cobertura para terceiros ou incremental.
3. Clique em **"Novo Certificado"**.
        `,
        image: 'https://placehold.co/600x400?text=Emissao+Bilhete'
      },
      {
        id: 'step-4',
        title: 'Preenchimento dos Dados da Viagem',
        content: `
1. Leia as informações e clique no check-box para aceitar. Clique em **"Seguinte"**.
2. Insira os dados da viagem: Número de Viajantes, Data de Início e Fim, e Destino.
3. Clique em **"Buscar"**.
4. Selecione o plano desejado clicando em **"Selecione"**.
        `,
        image: 'https://placehold.co/600x400?text=Dados+Viagem'
      },
      {
        id: 'step-5',
        title: 'Detalhes do Titular e Passageiros',
        content: `
1. Preencha os dados do Titular do Cartão.
2. Adicione dependentes (Cônjuge e Filhos) se necessário.
3. Insira os dados dos passageiros adicionais.
4. Clique em **"Seguinte"**.
        `,
        image: 'https://placehold.co/600x400?text=Detalhes+Passageiros'
      },
      {
        id: 'step-6',
        title: 'Verificação e Emissão',
        content: `
1. Selecione o responsável pelo pagamento.
2. Revise todos os dados inseridos.
3. Clique em **"Efetuar Pagamento"** (mesmo se o valor for zero/gratuito, o fluxo é similar).
4. Insira os dados do cartão para finalizar (se houver custo) ou apenas confirme.
5. Clique em **"Finalizar a Compra"**.

Você receberá um e-mail com o Bilhete de Seguros.
        `,
        image: 'https://placehold.co/600x400?text=Verificacao+Emissao'
      }
    ]
  },
  {
    id: '6',
    title: 'Aumento de Limite Pontual e Fixo - Via Portal',
    description: 'Como solicitar aumento de limite de transferências via portal.',
    category: 'Operacional',
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-1',
        title: 'Acessar Limites Operacionais',
        content: `
1. Selecione a conta do cliente no Portal.
2. Clique em **Transferências** > **Limites Operacionais**.
        `,
        image: 'https://placehold.co/600x400?text=Limites+Operacionais'
      },
      {
        id: 'step-2',
        title: 'Selecionar Tipo de Transferência',
        content: `
1. Selecione qual a TED objetiva para o aumento (Mesma titularidade ou Outra).
2. Clique no ícone de **editar** (lápis) ao lado do limite atual.
        `,
        image: 'https://placehold.co/600x400?text=Editar+Limite'
      },
      {
        id: 'step-3',
        title: 'Configurar Solicitação',
        content: `
1. Selecione a finalidade: **"Solicitar limite pontual"** ou **"Solicitar limite permanente"**.
2. Informe o valor desejado.
3. Informe a quantidade de vezes e o período (para limite pontual).
4. Justifique o motivo da solicitação.
5. Clique em **"Confirmar"**.
        `,
        image: 'https://placehold.co/600x400?text=Configurar+Solicitacao'
      },
      {
        id: 'step-4',
        title: 'Confirmação',
        content: `
1. Revise os dados da solicitação.
2. Clique em **"Confirmar"**.
3. Aguarde a mensagem de sucesso.

*Nota: O limite pontual tem duração de 30 min a 4h dependendo do caso e do histórico de transação do cliente.*
        `,
        image: 'https://placehold.co/600x400?text=Confirmacao'
      }
    ]
  }
];
