import daisyuiThemes from 'daisyui/src/theming/themes';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { THEMES } from '../Config';
import { useAppContext } from '../utils/app.context';
import { classNames } from '../utils/misc';
import StorageUtils from '../utils/storage';

export default function Header() {
  const navigate = useNavigate();
  const [selectedTheme, setSelectedTheme] = useState(StorageUtils.getTheme());
  const { setShowSettings } = useAppContext();
  const [showHelpPopup, setShowHelpPopup] = useState(false);

  const setTheme = (theme: string) => {
    StorageUtils.setTheme(theme);
    setSelectedTheme(theme);
  };

  useEffect(() => {
    document.body.setAttribute('data-theme', selectedTheme);
    document.body.setAttribute(
      'data-color-scheme',
      // @ts-expect-error daisyuiThemes complains about index type, but it should work
      daisyuiThemes[selectedTheme]?.['color-scheme'] ?? 'auto'
    );
  }, [selectedTheme]);

  const { isGenerating, viewingChat } = useAppContext();
  const isCurrConvGenerating = isGenerating(viewingChat?.conv.id ?? '');

  const removeConversation = () => {
    if (isCurrConvGenerating || !viewingChat) return;
    const convId = viewingChat?.conv.id;
    if (window.confirm('Tem certeza que deseja deletar essa conversa?')) {
      StorageUtils.remove(convId);
      navigate('/');
    }
  };

  const downloadConversation = () => {
    if (isCurrConvGenerating || !viewingChat) return;
    const convId = viewingChat?.conv.id;
    const conversationJson = JSON.stringify(viewingChat, null, 2);
    const blob = new Blob([conversationJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation_${convId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-row items-center pt-6 pb-6 sticky top-0 z-10 bg-base-100">
      {/* open sidebar button */}
      <label htmlFor="toggle-drawer" className="btn btn-ghost lg:hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          className="bi bi-list"
          viewBox="0 0 16 16"
        >
          <path
            fillRule="evenodd"
            d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"
          />
        </svg>
      </label>

      {/* <div className="grow text-2xl font-bold ml-2">🦅 Carcará</div> */}
      <div className="grow text-2xl font-bold ml-2">
        <img src="carcara-logo-nobg.png" alt="Carcará" style={{ height: '2em', width: '2em', verticalAlign: 'middle', display: 'inline' }} /> Carcará
      </div>


      {/* action buttons (top right) */}
      <div className="flex items-center">
        {viewingChat && (
          <div className="dropdown dropdown-end">
            {/* "..." button */}
            <button
              tabIndex={0}
              role="button"
              className="btn m-1"
              disabled={isCurrConvGenerating}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-three-dots-vertical"
                viewBox="0 0 16 16"
              >
                <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
              </svg>
            </button>
            {/* dropdown menu */}
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
            >
              <li onClick={downloadConversation}>
                <a>Baixar</a>
              </li>
              <li className="text-error" onClick={removeConversation}>
                <a>Apagar</a>
              </li>
            </ul>
          </div>
        )}

        <div className="tooltip tooltip-bottom" data-tip="Configurações">
          <button className="btn" onClick={() => setShowSettings(true)}>
            {/* settings button */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-gear"
              viewBox="0 0 16 16"
            >
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0" />
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z" />
            </svg>
          </button>
        </div>

        {/* theme controller is copied from https://daisyui.com/components/theme-controller/ */}
        <div className="tooltip tooltip-bottom" data-tip="Temas">
          <div className="dropdown dropdown-end dropdown-bottom">
            <div tabIndex={0} role="button" className="btn m-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-palette2"
                viewBox="0 0 16 16"
              >
                <path d="M0 .5A.5.5 0 0 1 .5 0h5a.5.5 0 0 1 .5.5v5.277l4.147-4.131a.5.5 0 0 1 .707 0l3.535 3.536a.5.5 0 0 1 0 .708L10.261 10H15.5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5H3a3 3 0 0 1-2.121-.879A3 3 0 0 1 0 13.044m6-.21 7.328-7.3-2.829-2.828L6 7.188zM4.5 13a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0M15 15v-4H9.258l-4.015 4zM0 .5v12.495zm0 12.495V13z" />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content bg-base-300 rounded-box z-[1] w-52 p-2 shadow-2xl h-80 overflow-y-auto"
            >
              <li>
                <button
                  className={classNames({
                    'btn btn-sm btn-block btn-ghost justify-start': true,
                    'btn-active': selectedTheme === 'auto',
                  })}
                  onClick={() => setTheme('auto')}
                >
                  auto
                </button>
              </li>
              {THEMES.map((theme) => (
                <li key={theme}>
                  <input
                    type="radio"
                    name="theme-dropdown"
                    className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                    aria-label={theme}
                    value={theme}
                    checked={selectedTheme === theme}
                    onChange={(e) => e.target.checked && setTheme(theme)}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* help button */}
        <div className="tooltip tooltip-bottom" data-tip="Ajuda">
          <button className="btn" onClick={() => setShowHelpPopup(true)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2zm0 4h2v6h-2z" />
            </svg>
          </button>
        </div>
      </div>


      {/* help popup */}
      {showHelpPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-base-100 p-6 rounded-lg w-full max-w-md max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Informações</h3>
              <button
                className="btn btn-sm btn-circle"
                onClick={() => setShowHelpPopup(false)}
              >
                ✕
              </button>
            </div>
            <div className="prose text-justify">


              <p>
                Bem-vindo(a) à plataforma <em>Carcará</em>! Você está acessando um ambiente de testes com modelos de linguagem avançados totalmente hospedados no supercomputador <strong>Santos Dumont</strong>, do LNCC.
              </p>
              <p>
                A plataforma utiliza uma versão <em>dinamicamente quantizada</em> do modelo <em>DeepSeek V3-0324</em>, permitindo uma execução eficiente em múltiplas GPUs.
              </p>
              <p>
                Todos os dados são processados <em>localmente</em>, sem envio para servidores externos. Todo o histórico de mensagens fica armazenado localmente no navegador do usuário e nenhuma informação é acessada ou armazenada pelo LNCC. Isso garante conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD)</strong> e reforça a <em>soberania da informação</em>, essencial para o desenvolvimento de pesquisas em tópicos sensíveis.
              </p>
              <p>
                Todo o histórico de mensagens fica armazenado apenas localmente, no próprio navegador do usuário.
              </p>
              <p>
                Este sistema está em <em>fase de testes</em>, e melhorias contínuas estão sendo realizadas para aperfeiçoar o serviço.
              </p>

              

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
