import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { classNames } from '../utils/misc';
import StorageUtils from '../utils/storage';
import { Conversation } from '../utils/types';

export default function Sidebar() {
  const params = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currConv, setCurrConv] = useState<Conversation | null>(null);

  useEffect(() => {
    StorageUtils.getOneConversation(params.convId ?? '').then(setCurrConv);
  }, [params.convId]);

  useEffect(() => {
    const handleConversationChange = async () => {
      setConversations(await StorageUtils.getAllConversations());
    };
    StorageUtils.onConversationChanged(handleConversationChange);
    handleConversationChange();
    return () => {
      StorageUtils.offConversationChanged(handleConversationChange);
    };
  }, []);

  return (
    <>
      <input
        id="toggle-drawer"
        type="checkbox"
        className="drawer-toggle"
        defaultChecked
      />


      <div className="drawer-side h-screen lg:h-screen z-50 lg:max-w-64">
        <label
          htmlFor="toggle-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <div className="flex flex-col bg-base-200 min-h-full max-w-64 py-4 px-4">

          <div className="flex flex-row items-center justify-between mb-4 mt-4">
            <h2 className="font-bold ml-4">Conversas</h2>

            {/* close sidebar button */}
            <label htmlFor="toggle-drawer" className="btn btn-ghost lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-arrow-bar-left"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M12.5 15a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 1 0v13a.5.5 0 0 1-.5.5M10 8a.5.5 0 0 1-.5.5H3.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L3.707 7.5H9.5a.5.5 0 0 1 .5.5"
                />
              </svg>
            </label>
          </div>
          <div className="mt-1 mb-4 mx-4 text-center text-xs opacity-40 space-y-2">
            <p>Executado no <a href="https://sdumont.lncc.br/"><u>SDumont</u>, apenas inferência local.</a> </p>

          </div>

          {/* list of conversations */}
          <div
            className={classNames({
              'btn btn-ghost justify-start': true,
              'btn-active': !currConv,
            })}
            onClick={() => navigate('/')}
          >
            + Nova conversa
          </div>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={classNames({
                'btn btn-ghost justify-start font-normal': true,
                'btn-active': conv.id === currConv?.id,
              })}
              onClick={() => navigate(`/chat/${conv.id}`)}
              dir="auto"
            >
              <span className="truncate">{conv.name}</span>
            </div>
          ))}
          <div className="mt-auto mx-4 text-center text-xs opacity-40 space-y-2">
            {/* <p>Runs on SDumont — local inference only.</p> */}
          </div>

          <div className="mt-4 mx-0">
            <img
              src="/institutional-logos.png"
              alt="Institutional logos"
              className="max-w-full h-auto opacity-80"
            />
          </div>
        </div>
      </div>
    </>
  );
}
