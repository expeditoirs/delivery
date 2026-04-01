import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CreatePostComposer from '../../components/posts/CreatePostComposer';
import StoryBar from "../../components/stories/StoryBar";
import StoryViewer from "../../components/stories/StoryViewer";
import FeedSection from "./components/FeedSection";
import useSocialHomeData from "./useSocialHomeData";

export default function HomeFeed() {
  const location = useLocation();
  const navigate = useNavigate();
  const { stories, feed, loading, erro, storyAberto, setStoryAberto, reloadFeed } = useSocialHomeData();
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerPedidoId, setComposerPedidoId] = useState('');

  useEffect(() => {
    if (location.state?.openComposer) {
      setComposerOpen(true);
      setComposerPedidoId(location.state?.pedidoId ? String(location.state.pedidoId) : '');
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  function openComposer(pedidoId = '') {
    setComposerPedidoId(pedidoId ? String(pedidoId) : '');
    setComposerOpen(true);
  }

  return (
    <div className="w-full min-h-full bg-theme pb-24">
      <StoryBar stories={stories} loading={loading} onOpen={setStoryAberto} />
      <section className="px-4 pt-4">
        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))] p-4 shadow-[0_18px_48px_rgba(2,6,23,0.4)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="mt-2 text-xl font-black text-white">Avalie um produto</h2>
            </div>
            <button type="button" onClick={() => openComposer()} className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#14b8a6,#06b6d4)] px-5 py-3 text-sm font-black uppercase tracking-[0.22em] text-slate-950 shadow-[0_14px_32px_rgba(6,182,212,0.28)] transition hover:brightness-110">
              <span className="material-icons text-lg">add_circle</span>
              Postar
            </button>
          </div>
        </div>
      </section>
      <FeedSection erro={erro} loading={loading} feed={feed} />
      <StoryViewer story={storyAberto} onClose={() => setStoryAberto(null)} />
      <CreatePostComposer isOpen={composerOpen} initialPedidoId={composerPedidoId} onClose={() => setComposerOpen(false)} onCreated={reloadFeed} />
    </div>
  );
}